import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import {
  X,
  Maximize2,
  Minimize2,
  Minus,
  RefreshCw,
  Terminal as TerminalIcon,
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

  const onSessionEndRef = useRef(onSessionEnd);
  useEffect(() => {
    onSessionEndRef.current = onSessionEnd;
  }, [onSessionEnd]);

  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const isMountedRef = useRef(true);

  // Stable connect / reconnect function
  const connectSession = useCallback(async () => {
    if (!xtermInstance.current || !isMountedRef.current) return;
    const term = xtermInstance.current;

    // Close any previous socket cleanly without triggering onclose loop
    if (socketRef.current) {
      socketRef.current.onclose = null;
      socketRef.current.close();
      socketRef.current = null;
    }

    setConnectionStatus('connecting');
    term.write('\r\n\x1b[36m[Console]\x1b[0m Requesting secure session ticket...\r\n');

    try {
      const session = await apiCall(`/vms/${vmId}/console-session`, { method: 'POST' });

      if (!isMountedRef.current) return;

      if (!session || !session.ticket) {
        throw new Error(session?.error || 'Failed to obtain console session ticket.');
      }

      term.write(`\x1b[32m[Console]\x1b[0m Ticket granted. Establishing SSH bridge to ${session.ip || vmIp}...\r\n`);

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/api/ws/terminal?ticket=${encodeURIComponent(session.ticket)}&vmId=${vmId}`;

      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) return;
        setConnectionStatus('connected');

        // Immediate fit & focus
        try {
          fitAddonRef.current?.fit();
          term.focus();
        } catch {}

        setTimeout(() => {
          if (!isMountedRef.current) return;
          try {
            fitAddonRef.current?.fit();
            term.focus();
            if (term.cols && term.rows && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
            }
          } catch {}
        }, 120);
      };

      ws.onmessage = (event) => {
        term.write(event.data);
      };

      ws.onerror = (err) => {
        console.warn('[WebConsole] WebSocket error:', err);
        if (!isMountedRef.current) return;
        setConnectionStatus('disconnected');
        term.write('\r\n\x1b[31m[WebSocket Error] Connection to SSH terminal gateway failed.\x1b[0m\r\n');
      };

      ws.onclose = () => {
        if (!isMountedRef.current) return;
        setConnectionStatus('disconnected');
        onSessionEndRef.current?.();
      };
    } catch (err: any) {
      console.error('[WebConsole] Error acquiring ticket:', err);
      if (!isMountedRef.current) return;
      setConnectionStatus('disconnected');
      if (err.message?.toLowerCase().includes('powered off') || err.message?.toLowerCase().includes('stopped')) {
        term.write(`\r\n\x1b[1;33m[Notice]\x1b[0m ${err.message}\r\n`);
      } else {
        term.write(`\r\n\x1b[31m[Console Error]\x1b[0m ${err.message || 'Unable to establish console session'}\x1b[0m\r\n`);
      }
    }
  }, [vmId, vmIp]);

  // Terminal instance initialization — runs strictly ONCE when modal opens
  useEffect(() => {
    isMountedRef.current = true;
    if (!terminalRef.current) return;
    const currentContainer = terminalRef.current;

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
    term.open(currentContainer);

    xtermInstance.current = term;
    fitAddonRef.current = fitAddon;

    // Helper to reliably fit and focus the terminal helper textarea
    const triggerFitAndFocus = () => {
      try {
        fitAddon.fit();
        term.focus();
        currentContainer.querySelector<HTMLTextAreaElement>('.xterm-helper-textarea')?.focus();
      } catch {}
    };

    // Forward keystrokes to remote SSH stdin
    const onDataDisposable = term.onData((data) => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(data);
      }
    });

    // Handle Ctrl+C (Copy if selected) and Ctrl+V (allow native paste)
    term.attachCustomKeyEventHandler((event: KeyboardEvent) => {
      // 1. Copy: Ctrl+C / Cmd+C when text is highlighted
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c') {
        if (term.hasSelection()) {
          const selectedText = term.getSelection();
          if (selectedText) {
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(selectedText).catch(() => {});
            }
          }
          return false; // Handled, do not send interrupt signal
        }
        return true; // No selection: allow standard Ctrl+C SIGINT in bash
      }

      // 2. Paste: Ctrl+V / Cmd+V
      if ((event.ctrlKey || event.metaKey) && (event.key.toLowerCase() === 'v' || event.code === 'KeyV')) {
        if (event.type === 'keydown') {
          if (navigator.clipboard && navigator.clipboard.readText) {
            navigator.clipboard.readText()
              .then((text) => {
                if (text) term.paste(text);
              })
              .catch(() => {});
          }
        }
        return false;
      }

      return true;
    });

    // Native browser paste event listener (listens on both container & window)
    const handleNativePaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData('text/plain') || e.clipboardData?.getData('text');
      if (text) {
        e.preventDefault();
        term.paste(text);
      }
    };
    currentContainer.addEventListener('paste', handleNativePaste);
    window.addEventListener('paste', handleNativePaste);

    // Right-click paste (PuTTY / Windows Terminal style)
    const handleContextMenu = async (e: MouseEvent) => {
      if (!term.hasSelection()) {
        try {
          const text = await navigator.clipboard.readText();
          if (text) {
            term.paste(text);
            e.preventDefault();
          }
        } catch {}
      }
    };
    currentContainer.addEventListener('contextmenu', handleContextMenu);

    // Container interaction focus listeners
    const handlePointerFocus = () => {
      triggerFitAndFocus();
    };
    currentContainer.addEventListener('mousedown', handlePointerFocus);
    currentContainer.addEventListener('pointerdown', handlePointerFocus);

    // ResizeObserver watches modal container animations and window changes continuously
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const entry = entries[0];
      if (entry.contentRect.width > 50 && entry.contentRect.height > 50) {
        try {
          fitAddon.fit();
          if (term.cols && term.rows && socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
          }
        } catch {}
      }
    });
    resizeObserver.observe(currentContainer);

    const handleWindowResize = () => {
      triggerFitAndFocus();
      if (term.cols && term.rows && socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
      }
    };
    window.addEventListener('resize', handleWindowResize);

    // Focus sequence: immediate, animation frame, and after CSS modal transition completes
    triggerFitAndFocus();
    requestAnimationFrame(triggerFitAndFocus);
    setTimeout(triggerFitAndFocus, 100);
    setTimeout(triggerFitAndFocus, 250);
    setTimeout(triggerFitAndFocus, 500);

    // Initial connection
    connectSession();

    return () => {
      isMountedRef.current = false;
      window.removeEventListener('resize', handleWindowResize);
      window.removeEventListener('paste', handleNativePaste);
      currentContainer.removeEventListener('paste', handleNativePaste);
      currentContainer.removeEventListener('contextmenu', handleContextMenu);
      currentContainer.removeEventListener('mousedown', handlePointerFocus);
      currentContainer.removeEventListener('pointerdown', handlePointerFocus);
      resizeObserver.disconnect();
      onDataDisposable.dispose();
      if (socketRef.current) {
        socketRef.current.onclose = null;
        socketRef.current.close();
      }
      term.dispose();
    };
  }, [vmId]); // Strictly runs once per vmId

  const handleReconnect = () => {
    if (xtermInstance.current) {
      xtermInstance.current.clear();
    }
    connectSession();
  };

  const handleRestore = () => {
    setIsMinimized(false);
    setTimeout(() => {
      fitAddonRef.current?.fit();
      xtermInstance.current?.focus();
    }, 100);
  };

  return (
    <>
      {/* 1. MINIMIZED FLOATING DOCK BADGE */}
      {isMinimized && (
        <div className="fixed bottom-5 right-5 z-[130] bg-[#090d16]/95 border border-slate-700/90 rounded-2xl shadow-2xl p-3 flex items-center gap-3 backdrop-blur-md animate-in slide-in-from-bottom-4 duration-200 select-none">
          <div 
            onClick={handleRestore}
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity"
            title="Click to restore Web Console"
          >
            <span className={`w-2.5 h-2.5 rounded-full ${
              connectionStatus === 'connected' ? 'bg-emerald-500 animate-pulse' :
              connectionStatus === 'connecting' ? 'bg-amber-400 animate-ping' : 'bg-rose-500'
            }`} />
            <TerminalIcon className="w-4 h-4 text-blue-400" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white font-mono">{vmName}</span>
              <span className="text-[10px] text-emerald-400 font-mono">
                {connectionStatus === 'connected' ? 'Terminal Active' : connectionStatus.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
            <button
              onClick={handleRestore}
              title="Restore Console"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              title="Close Console"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. FULL / RESTORED CONSOLE MODAL */}
      <div 
        className={`fixed inset-0 z-[120] transition-opacity duration-200 ${
          isMinimized 
            ? 'pointer-events-none opacity-0' 
            : 'bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 md:p-6 opacity-100'
        }`}
      >
        <div 
          className={`bg-[#090d16] border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
            isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-5xl h-[82vh] min-h-[520px]'
          }`}
        >
          {/* CONSOLE HEADER BAR */}
          <div className="bg-slate-900/95 border-b border-slate-800 px-4 py-3 flex items-center justify-between select-none">
            <div className="flex items-center gap-2.5">
              <span className={`w-2.5 h-2.5 rounded-full ${
                connectionStatus === 'connected' ? 'bg-emerald-500 animate-pulse' :
                connectionStatus === 'connecting' ? 'bg-amber-400 animate-ping' : 'bg-rose-500'
              }`} />
              <TerminalIcon className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-white font-mono tracking-wide">
                {vmName}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleReconnect}
                title="Reconnect Console"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsMinimized(true)}
                title="Minimize Console"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
              >
                <Minus className="w-4 h-4" />
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

          {/* TERMINAL CANVAS CONTAINER */}
          <div 
            ref={terminalRef} 
            tabIndex={0}
            onClick={() => xtermInstance.current?.focus()}
            className="flex-1 w-full p-3 overflow-hidden font-mono cursor-text outline-none focus:outline-none"
            style={{ minHeight: 0 }}
          />

          {/* CONSOLE FOOTER STATUS BAR */}
          <div className="bg-slate-950 border-t border-slate-800/80 px-4 py-2 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none">
            <div className="flex items-center gap-2">
              <span>Status:</span>
              <strong className={
                connectionStatus === 'connected' ? 'text-emerald-400 font-semibold' :
                connectionStatus === 'connecting' ? 'text-amber-400 font-semibold' : 'text-rose-400 font-semibold'
              }>
                {connectionStatus.toUpperCase()}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
