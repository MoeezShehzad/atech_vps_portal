import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import {
  X,
  Maximize2,
  Minimize2,
  RefreshCw,
  Terminal as TerminalIcon,
  ShieldCheck,
  Eye,
  EyeOff,
  Copy,
  Check,
  Key,
} from 'lucide-react';
import { apiCall } from '../services/api';

interface WebConsoleModalProps {
  vmId: number;
  vmName: string;
  vmIp: string;
  adminUser?: string;
  adminPassword?: string;
  onClose: () => void;
  onSessionEnd?: () => void;
}

export default function WebConsoleModal({
  vmId,
  vmName,
  vmIp,
  adminUser: initialUser = 'ubuntu',
  adminPassword: initialPassword = 'root',
  onClose,
  onSessionEnd,
}: WebConsoleModalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermInstance = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [activeIp, setActiveIp] = useState<string>(vmIp || 'DHCP Leasing...');
  const [activeUser, setActiveUser] = useState<string>(initialUser);
  const [activePassword, setActivePassword] = useState<string>(initialPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [copiedSSH, setCopiedSSH] = useState(false);

  const connectSession = useCallback(async () => {
    if (!xtermInstance.current) return;
    const term = xtermInstance.current;

    // Close any previous socket
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    setConnectionStatus('connecting');
    term.write('\r\n\x1b[36m[Console]\x1b[0m Requesting secure session ticket...\r\n');

    try {
      const session = await apiCall(`/vms/${vmId}/console-session`, { method: 'POST' });

      if (!session || !session.ticket) {
        throw new Error(session?.error || 'Failed to obtain console session ticket.');
      }

      if (session.ip) setActiveIp(session.ip);
      if (session.adminUser) setActiveUser(session.adminUser);
      if (session.adminPassword) setActivePassword(session.adminPassword);

      term.write(`\x1b[32m[Console]\x1b[0m Ticket granted. Establishing SSH bridge to ${session.ip || vmIp}...\r\n`);

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/api/ws/terminal?ticket=${encodeURIComponent(session.ticket)}&vmId=${vmId}`;

      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus('connected');
        term.focus();
        setTimeout(() => {
          fitAddonRef.current?.fit();
          if (term.cols && term.rows && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
          }
        }, 150);
      };

      ws.onmessage = (event) => {
        term.write(event.data);
      };

      ws.onerror = (err) => {
        console.warn('[WebConsole] WebSocket error:', err);
        setConnectionStatus('disconnected');
        term.write('\r\n\x1b[31m[WebSocket Error] Connection to SSH terminal gateway failed.\x1b[0m\r\n');
      };

      ws.onclose = () => {
        setConnectionStatus('disconnected');
        onSessionEnd?.();
      };
    } catch (err: any) {
      console.error('[WebConsole] Error acquiring ticket:', err);
      setConnectionStatus('disconnected');
      term.write(`\r\n\x1b[31m[Authentication Error] ${err.message || 'Unauthorized console access'}\x1b[0m\r\n`);
    }
  }, [vmId, vmIp]);

  useEffect(() => {
    if (!terminalRef.current) return;

    // 1. Initialize xterm
    const term = new XTerm({
      cursorBlink: true,
      cursorStyle: 'block',
      fontSize: 13,
      lineHeight: 1.25,
      fontFamily: '"Fira Code", Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#090d16',
        foreground: '#e2e8f0',
        cursor: '#38bdf8',
        selectionBackground: 'rgba(56, 189, 248, 0.3)',
        black: '#090d16',
        red: '#f87171',
        green: '#4ade80',
        yellow: '#facc15',
        blue: '#60a5fa',
        magenta: '#c084fc',
        cyan: '#38bdf8',
        white: '#f8fafc',
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermInstance.current = term;
    fitAddonRef.current = fitAddon;

    // Forward keystrokes to remote SSH stdin
    const onDataDisposable = term.onData((data) => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(data);
      }
    });

    const handleResize = () => {
      fitAddon.fit();
      if (term.cols && term.rows && socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
      }
    };
    window.addEventListener('resize', handleResize);

    // Initial connection
    connectSession();

    return () => {
      window.removeEventListener('resize', handleResize);
      onDataDisposable.dispose();
      if (socketRef.current) {
        socketRef.current.close();
      }
      term.dispose();
    };
  }, [connectSession]);

  const handleReconnect = () => {
    if (xtermInstance.current) {
      xtermInstance.current.clear();
    }
    connectSession();
  };

  const copyPasswordToClipboard = () => {
    navigator.clipboard.writeText(activePassword);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  const copySSHCommand = () => {
    navigator.clipboard.writeText(`ssh ${activeUser}@${activeIp}`);
    setCopiedSSH(true);
    setTimeout(() => setCopiedSSH(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-200">
      <div 
        className={`bg-[#090d16] border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
          isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-5xl h-[82vh] min-h-[520px]'
        }`}
      >
        {/* CONSOLE HEADER BAR */}
        <div className="bg-slate-900/95 border-b border-slate-800 px-4 py-3 flex items-center justify-between select-none">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${
                connectionStatus === 'connected' ? 'bg-emerald-500 animate-pulse' :
                connectionStatus === 'connecting' ? 'bg-amber-400 animate-ping' : 'bg-rose-500'
              }`} />
              <TerminalIcon className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white font-mono tracking-wide">
                  {vmName}
                </span>
                <span className="text-[11px] text-slate-300 font-mono bg-slate-800/90 px-2 py-0.5 rounded border border-slate-700/60">
                  {activeIp}
                </span>
              </div>
            </div>
          </div>

          {/* CREDENTIALS TOOLBAR IN HEADER */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-950/60 px-2.5 py-1 rounded-xl border border-slate-800 text-[11px] font-mono">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Key className="w-3 h-3 text-amber-400" />
              <span>User:</span>
              <strong className="text-slate-200">{activeUser}</strong>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span>Pass:</span>
              <strong className="text-slate-200">{showPassword ? activePassword : '••••••••'}</strong>
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-white p-0.5"
                title={showPassword ? 'Hide Password' : 'Show Password'}
              >
                {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </button>
              <button
                onClick={copyPasswordToClipboard}
                className="text-slate-400 hover:text-white p-0.5 ml-0.5"
                title="Copy Password"
              >
                {copiedPassword ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            <span className="text-slate-700">|</span>
            <button
              onClick={copySSHCommand}
              className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-[10px]"
              title="Copy ssh command"
            >
              {copiedSSH ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>ssh {activeUser}@{activeIp}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              <ShieldCheck className="w-3 h-3" /> Secure SSH Shell
            </span>

            <button
              onClick={handleReconnect}
              title="Reconnect Console"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                setIsFullscreen(!isFullscreen);
                setTimeout(() => fitAddonRef.current?.fit(), 150);
              }}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={onClose}
              title="Close Console (Esc)"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* MOBILE/TABLET QUICK CREDENTIALS BAR */}
        <div className="lg:hidden bg-slate-950 border-b border-slate-800/80 px-4 py-1.5 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span>User: <strong className="text-slate-200">{activeUser}</strong></span>
            <span>•</span>
            <span>Pass: <strong className="text-slate-200">{showPassword ? activePassword : '••••••'}</strong></span>
            <button onClick={() => setShowPassword(!showPassword)} className="p-0.5 hover:text-white">
              {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </button>
          </div>
          <button
            onClick={copyPasswordToClipboard}
            className="flex items-center gap-1 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-0.5 rounded transition-all"
          >
            {copiedPassword ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>Copy Password</span>
          </button>
        </div>

        {/* TERMINAL CANVAS CONTAINER */}
        <div 
          ref={terminalRef} 
          onClick={() => xtermInstance.current?.focus()}
          className="flex-1 w-full p-3 overflow-hidden font-mono cursor-text"
          style={{ minHeight: 0 }}
        />

        {/* CONSOLE FOOTER STATUS BAR */}
        <div className="bg-slate-950 border-t border-slate-800/80 px-4 py-1.5 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-3">
            <span>Status: <strong className={connectionStatus === 'connected' ? 'text-emerald-400' : 'text-amber-400'}>{connectionStatus.toUpperCase()}</strong></span>
            <span>Port: 22</span>
            <span>Type: xterm-256color</span>
          </div>
          <div className="text-[10px] text-slate-500">
            Paste with Ctrl+V / Cmd+V
          </div>
        </div>
      </div>
    </div>
  );
}
