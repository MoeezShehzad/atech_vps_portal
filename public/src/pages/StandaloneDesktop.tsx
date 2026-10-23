import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Guacamole from 'guacamole-common-js';
import {
  Maximize2,
  Minimize2,
  RefreshCw,
  Monitor,
  Download,
  KeyRound,
  Clipboard,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  X,
  ExternalLink,
} from 'lucide-react';
import { apiCall } from '../services/api';

export default function StandaloneDesktop() {
  const { vmId } = useParams<{ vmId: string }>();
  const navigate = useNavigate();

  const displayContainerRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<any>(null);
  const tunnelRef = useRef<any>(null);
  const mouseRef = useRef<any>(null);
  const keyboardRef = useRef<any>(null);
  const isConnectingRef = useRef(false);
  const isMountedRef = useRef(true);

  const [vmName, setVmName] = useState<string>('Windows Desktop');
  const [activeIp, setActiveIp] = useState<string>('');
  const [adminUser, setAdminUser] = useState<string>('user');
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected' | 'error'
  >('connecting');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [clipboardText, setClipboardText] = useState('');
  const [showClipboardBar, setShowClipboardBar] = useState(false);

  // Auto-fit display scale
  const handleResize = useCallback(() => {
    if (!displayContainerRef.current || !clientRef.current) return;
    const container = displayContainerRef.current;
    const disp = clientRef.current.getDisplay();
    const dw = disp.getWidth();
    const dh = disp.getHeight();
    const cw = container.clientWidth;
    const ch = container.clientHeight;

    if (dw > 0 && dh > 0 && cw > 0 && ch > 0) {
      const scaleX = cw / dw;
      const scaleY = ch / dh;
      const scale = Math.min(scaleX, scaleY);
      disp.scale(scale);
    }
  }, []);

  // Cleanly disconnect Guacamole client
  const cleanupGuacamole = useCallback(() => {
    if (keyboardRef.current) {
      keyboardRef.current.onkeydown = null;
      keyboardRef.current.onkeyup = null;
      keyboardRef.current = null;
    }
    if (mouseRef.current) {
      mouseRef.current.onmousedown = null;
      mouseRef.current.onmouseup = null;
      mouseRef.current.onmousemove = null;
      mouseRef.current = null;
    }
    if (clientRef.current) {
      try {
        clientRef.current.disconnect();
      } catch {}
      clientRef.current = null;
    }
    if (tunnelRef.current) {
      try {
        tunnelRef.current.disconnect();
      } catch {}
      tunnelRef.current = null;
    }
    if (displayContainerRef.current) {
      displayContainerRef.current.innerHTML = '';
    }
    isConnectingRef.current = false;
  }, []);

  // Connect to Windows VM via Guacamole Gateway
  const connectSession = useCallback(async () => {
    if (!isMountedRef.current || !vmId) return;
    if (isConnectingRef.current) return;
    isConnectingRef.current = true;

    cleanupGuacamole();
    setConnectionStatus('connecting');
    setErrorMessage('');

    try {
      // 1. Request secure Guacamole session token from backend
      const session = await apiCall(`/vms/${vmId}/console-session`, { method: 'POST' });
      if (!isMountedRef.current) return;

      if (!session || (!session.token && !session.ticket)) {
        throw new Error(session?.error || 'Failed to authorize Windows Desktop session ticket.');
      }

      if (session.vmName) setVmName(session.vmName);
      if (session.ip) setActiveIp(session.ip);
      if (session.adminUser) setAdminUser(session.adminUser);

      const guacToken = session.token || session.ticket;

      // 2. Build WebSocket Tunnel URL
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/api/ws/guacamole`;

      const tunnel = new Guacamole.WebSocketTunnel(wsUrl);
      tunnelRef.current = tunnel;

      const client = new Guacamole.Client(tunnel);
      clientRef.current = client;

      // 3. Attach display element
      const display = client.getDisplay();
      const displayEl = display.getElement();

      displayEl.style.position = 'relative';
      displayEl.style.boxShadow = '0 10px 40px rgba(0,0,0,0.6)';

      if (displayContainerRef.current) {
        displayContainerRef.current.innerHTML = '';
        displayContainerRef.current.appendChild(displayEl);
      }

      // Handle connection state changes
      client.onstatechange = (state: number) => {
        if (!isMountedRef.current) return;
        // 0: IDLE, 1: CONNECTING, 2: WAITING, 3: CONNECTED, 4: DISCONNECTING, 5: DISCONNECTED
        if (state === 3) {
          setConnectionStatus('connected');
          setTimeout(handleResize, 100);
        } else if (state === 5) {
          setConnectionStatus('disconnected');
        }
      };

      // Critical: Listen for display resize from remote desktop server
      display.onresize = (w: number, h: number) => {
        if (w > 0 && h > 0) {
          handleResize();
        }
      };

      client.onerror = (status: any) => {
        if (!isMountedRef.current) return;
        console.error('[Guacamole Client Error]:', status);
        setConnectionStatus('error');
        setErrorMessage(status.message || 'Remote desktop bridge closed or target VM unreachable.');
      };

      // 4. Connect with encrypted token
      client.connect(`token=${encodeURIComponent(guacToken)}`);

      // 5. Mouse interactions
      const mouse = new Guacamole.Mouse(displayEl);
      mouseRef.current = mouse;
      mouse.onmousedown = mouse.onmouseup = mouse.onmousemove = (mouseState: any) => {
        client.sendMouseState(mouseState);
      };

      // 6. Keyboard interactions
      const keyboard = new Guacamole.Keyboard(document);
      keyboardRef.current = keyboard;
      keyboard.onkeydown = (keysym: number) => {
        client.sendKeyEvent(1, keysym);
      };
      keyboard.onkeyup = (keysym: number) => {
        client.sendKeyEvent(0, keysym);
      };

      setTimeout(handleResize, 500);
    } catch (err: any) {
      if (!isMountedRef.current) return;
      console.error('[StandaloneDesktop Connect Error]:', err);
      setConnectionStatus('error');
      setErrorMessage(err.message || 'Failed to establish connection to Windows Desktop.');
    } finally {
      isConnectingRef.current = false;
    }
  }, [vmId, cleanupGuacamole, handleResize]);

  useEffect(() => {
    isMountedRef.current = true;
    connectSession();

    window.addEventListener('resize', handleResize);

    return () => {
      isMountedRef.current = false;
      window.removeEventListener('resize', handleResize);
      cleanupGuacamole();
    };
  }, [connectSession, cleanupGuacamole, handleResize]);

  // Send Ctrl + Alt + Delete
  const sendCtrlAltDel = () => {
    if (!clientRef.current) return;
    clientRef.current.sendKeyEvent(1, 0xFFE3);
    clientRef.current.sendKeyEvent(1, 0xFFE9);
    clientRef.current.sendKeyEvent(1, 0xFFFF);
    setTimeout(() => {
      clientRef.current?.sendKeyEvent(0, 0xFFFF);
      clientRef.current?.sendKeyEvent(0, 0xFFE9);
      clientRef.current?.sendKeyEvent(0, 0xFFE3);
    }, 100);
  };

  // Send Windows (Super) key
  const sendWindowsKey = () => {
    if (!clientRef.current) return;
    clientRef.current.sendKeyEvent(1, 0xFFEB);
    setTimeout(() => {
      clientRef.current?.sendKeyEvent(0, 0xFFEB);
    }, 100);
  };

  // Paste / Send clipboard text
  const sendClipboardTextToGuest = () => {
    if (!clientRef.current || !clipboardText) return;
    for (let i = 0; i < clipboardText.length; i++) {
      const charCode = clipboardText.charCodeAt(i);
      clientRef.current.sendKeyEvent(1, charCode);
      clientRef.current.sendKeyEvent(0, charCode);
    }
    setClipboardText('');
    setShowClipboardBar(false);
  };

  // Download .rdp file
  const downloadRdpFile = () => {
    const effectiveIp = activeIp || '172.21.39.51';
    const rdpContent = [
      `full address:s:${effectiveIp}:3389`,
      `username:s:${adminUser || 'user'}`,
      'prompt for credentials:i:1',
      'screen mode id:i:2',
      'use multimon:i:0',
      'desktopwidth:i:1920',
      'desktopheight:i:1080',
      'session bpp:i:32',
      'compression:i:1',
      'keyboardhook:i:2',
      'audiomode:i:0',
      'redirectclipboard:i:1',
      'redirectprinters:i:0',
      'redirectcomports:i:0',
      'redirectsmartcards:i:0',
    ].join('\r\n');

    const blob = new Blob([rdpContent], { type: 'application/x-rdp' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${vmName || 'Windows-VPS'}.rdp`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="w-screen h-screen bg-slate-950 flex flex-col overflow-hidden select-none font-sans">
      {/* Top Professional Control Bar */}
      <header className="h-12 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between z-20 shrink-0">
        {/* Left: Brand & VM Meta */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-sky-400" />
            <h1 className="text-sm font-semibold text-white tracking-wide">{vmName}</h1>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              Windows 10 {activeIp ? `(${activeIp}:3389)` : ''}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          {/* Connection Status Indicator */}
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected'
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                  : connectionStatus === 'connecting'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-rose-500'
              }`}
            />
            <span className="text-xs text-slate-300 font-mono capitalize">
              {connectionStatus}
            </span>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Ctrl+Alt+Del */}
          <button
            onClick={sendCtrlAltDel}
            disabled={connectionStatus !== 'connected'}
            title="Send Ctrl+Alt+Del (Unlock/Login Windows)"
            className="px-2.5 py-1 text-xs font-mono font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Ctrl+Alt+Del</span>
          </button>

          {/* Windows Start Key */}
          <button
            onClick={sendWindowsKey}
            disabled={connectionStatus !== 'connected'}
            title="Send Windows Start Key"
            className="px-2.5 py-1 text-xs font-mono font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <span className="text-sky-400 font-bold">⊞</span>
            <span className="hidden sm:inline">Start</span>
          </button>

          {/* Clipboard Paste Tool */}
          <button
            onClick={() => setShowClipboardBar((prev) => !prev)}
            disabled={connectionStatus !== 'connected'}
            title="Send text to guest clipboard"
            className={`p-1.5 rounded-md text-slate-300 hover:text-white border transition-colors cursor-pointer ${
              showClipboardBar
                ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700'
            }`}
          >
            <Clipboard className="w-3.5 h-3.5" />
          </button>

          {/* Download Native .RDP file */}
          <button
            onClick={downloadRdpFile}
            title="Download .RDP file for native Microsoft Remote Desktop"
            className="px-2.5 py-1 text-xs font-medium rounded-md bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">.RDP File</span>
          </button>

          {/* Reconnect button */}
          <button
            onClick={connectSession}
            title="Reconnect Desktop Session"
            className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen toggle */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </header>

      {/* Floating Clipboard Input Bar */}
      {showClipboardBar && (
        <div className="bg-slate-900/95 border-b border-slate-800 px-4 py-2 flex items-center gap-2 z-20">
          <input
            type="text"
            placeholder="Type or paste text to send directly to your Windows VM..."
            value={clipboardText}
            onChange={(e) => setClipboardText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendClipboardTextToGuest()}
            className="flex-1 px-3 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            autoFocus
          />
          <button
            onClick={sendClipboardTextToGuest}
            className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium rounded transition-colors cursor-pointer"
          >
            Send Text
          </button>
          <button
            onClick={() => setShowClipboardBar(false)}
            className="p-1 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Remote Desktop Canvas Viewport */}
      <div className="relative flex-1 w-full h-full bg-slate-950 overflow-hidden flex items-center justify-center">
        {/* Guacamole Canvas Mount Container */}
        <div
          ref={displayContainerRef}
          className="w-full h-full flex items-center justify-center overflow-hidden"
        />

        {/* Connecting Spinner Overlay */}
        {connectionStatus === 'connecting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-xs z-10">
            <RefreshCw className="w-8 h-8 text-sky-400 animate-spin mb-3" />
            <p className="text-sm font-medium text-white mb-1">Connecting to Windows Desktop...</p>
            <p className="text-xs text-slate-400">
              Establishing high-speed HTML5 RDP bridge (user: {adminUser || 'user'})
            </p>
          </div>
        )}

        {/* Disconnected / Error Overlay */}
        {(connectionStatus === 'disconnected' || connectionStatus === 'error') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-xs z-10 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">
              {connectionStatus === 'error' ? 'Connection Error' : 'Desktop Session Ended'}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mb-4">
              {errorMessage || 'The remote desktop session was closed or the Windows VM is restarting.'}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={connectSession}
                className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-sky-600/20 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Try Again
              </button>
              <button
                onClick={downloadRdpFile}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-2 border border-slate-700 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Open in Native RDP
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info Bar */}
      <footer className="h-7 bg-slate-900 border-t border-slate-800/80 px-4 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Zero Client Software Required • Direct In-Browser HTML5 RDP</span>
        </div>
        <div className="hidden sm:block font-mono text-[10px]">
          Press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300">Ctrl+Alt+Del</kbd> above to unlock screen
        </div>
      </footer>
    </div>
  );
}
