import React, { useEffect, useRef, useState, useCallback } from 'react';
import Guacamole from 'guacamole-common-js';
import {
  X,
  Maximize2,
  Minimize2,
  RefreshCw,
  Monitor,
  Download,
  KeyRound,
  Clipboard,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { apiCall } from '../services/api';

interface WebDesktopModalProps {
  vmId: number;
  vmName: string;
  vmIp?: string;
  adminUser?: string;
  adminPassword?: string;
  onClose: () => void;
  onSessionEnd?: () => void;
}

export default function WebDesktopModal({
  vmId,
  vmName,
  vmIp,
  adminUser = 'Administrator',
  adminPassword,
  onClose,
  onSessionEnd,
}: WebDesktopModalProps) {
  const displayContainerRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<any>(null);
  const tunnelRef = useRef<any>(null);
  const mouseRef = useRef<any>(null);
  const keyboardRef = useRef<any>(null);

  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected' | 'error'
  >('connecting');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [clipboardText, setClipboardText] = useState('');
  const [showClipboardBar, setShowClipboardBar] = useState(false);
  const [activeIp, setActiveIp] = useState<string>(vmIp || '');
  const isMountedRef = useRef(true);

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
  }, []);

  // Connect to Windows VM via Guacamole Gateway
  const connectSession = useCallback(async () => {
    if (!isMountedRef.current) return;
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

      if (session.ip) {
        setActiveIp(session.ip);
      }

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
        } else if (state === 5) {
          setConnectionStatus('disconnected');
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

      // Synchronize remote Windows cursor as local hardware cursor
      display.oncursor = (canvas: HTMLCanvasElement, hotspotX: number, hotspotY: number) => {
        display.showCursor(false);
        try {
          const dataUrl = canvas.toDataURL();
          displayEl.style.cursor = `url(${dataUrl}) ${hotspotX} ${hotspotY}, auto`;
        } catch {
          displayEl.style.cursor = 'default';
        }
      };

      // High-precision mouse coordinate tracking using getBoundingClientRect
      if ((Guacamole as any).Position) {
        (Guacamole as any).Position.fromClientPosition = function (element: HTMLElement, clientX: number, clientY: number) {
          const position = new (Guacamole as any).Position();
          const rect = element.getBoundingClientRect();
          position.x = clientX - rect.left;
          position.y = clientY - rect.top;
          return position;
        };
      }

      // 5. Mouse interactions with display scale translation
      const mouse = new Guacamole.Mouse(displayEl);
      mouseRef.current = mouse;
      mouse.onmousedown = mouse.onmouseup = mouse.onmousemove = (mouseState: any) => {
        client.sendMouseState(mouseState, true);
      };
      mouse.onmouseout = () => {
        display.showCursor(false);
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

      // 7. Auto-fit display scale
      const handleResize = () => {
        if (!displayContainerRef.current || !clientRef.current) return;
        const container = displayContainerRef.current;
        const disp = clientRef.current.getDisplay();
        const dispWidth = disp.getWidth();
        const dispHeight = disp.getHeight();

        if (dispWidth > 0 && dispHeight > 0) {
          const scaleX = container.clientWidth / dispWidth;
          const scaleY = container.clientHeight / dispHeight;
          const scale = Math.min(scaleX, scaleY, 1.0);
          disp.scale(scale);
        }
      };

      window.addEventListener('resize', handleResize);
      setTimeout(handleResize, 500);

    } catch (err: any) {
      if (!isMountedRef.current) return;
      console.error('[WebDesktopModal Connect Error]:', err);
      setConnectionStatus('error');
      setErrorMessage(err.message || 'Failed to establish connection to Windows Desktop.');
    }
  }, [vmId, cleanupGuacamole]);

  useEffect(() => {
    isMountedRef.current = true;
    connectSession();

    return () => {
      isMountedRef.current = false;
      cleanupGuacamole();
      if (onSessionEnd) onSessionEnd();
    };
  }, [connectSession, cleanupGuacamole, onSessionEnd]);

  // Send Ctrl + Alt + Delete key combination to Windows VM
  const sendCtrlAltDel = () => {
    if (!clientRef.current) return;
    // Keysyms: Ctrl_L = 0xFFE3, Alt_L = 0xFFE9, Delete = 0xFFFF
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
    // Super_L = 0xFFEB
    clientRef.current.sendKeyEvent(1, 0xFFEB);
    setTimeout(() => {
      clientRef.current?.sendKeyEvent(0, 0xFFEB);
    }, 100);
  };

  // Paste / Send clipboard text to guest Windows VM
  const sendClipboardTextToGuest = () => {
    if (!clientRef.current || !clipboardText) return;
    // Send each character as keysym
    for (let i = 0; i < clipboardText.length; i++) {
      const charCode = clipboardText.charCodeAt(i);
      clientRef.current.sendKeyEvent(1, charCode);
      clientRef.current.sendKeyEvent(0, charCode);
    }
    setClipboardText('');
    setShowClipboardBar(false);
  };

  // Download .rdp file for native Microsoft Remote Desktop app
  const downloadRdpFile = () => {
    const effectiveIp = activeIp || vmIp || '172.21.39.51';
    const rdpContent = [
      `full address:s:${effectiveIp}:3389`,
      `username:s:${adminUser || 'Administrator'}`,
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
      'displayconnectionbar:i:1',
      'autoreconnection enabled:i:1',
      'authentication level:i:2',
      'negotiate security layer:i:1',
    ].join('\r\n');

    const blob = new Blob([rdpContent], { type: 'application/x-rdp' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${vmName || 'windows-vps'}.rdp`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 md:p-6 animate-in fade-in duration-200">
      <div
        className={`flex flex-col bg-slate-950 border border-slate-800 rounded-xl shadow-2xl overflow-hidden transition-all duration-300 ${
          isFullscreen
            ? 'w-full h-full rounded-none border-none'
            : 'w-full max-w-6xl h-[88vh]'
        }`}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 select-none">
          {/* Left Title & Status */}
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Monitor className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white tracking-wide">
                  {vmName}
                </span>
                <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                  Windows RDP {activeIp ? `(${activeIp})` : (vmIp ? `(${vmIp})` : '')}
                </span>
              </div>
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-1.5 ml-2">
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

          {/* Right Action Controls */}
          <div className="flex items-center gap-1.5">
            {/* Ctrl+Alt+Del Quick Button */}
            <button
              onClick={sendCtrlAltDel}
              disabled={connectionStatus !== 'connected'}
              title="Send Ctrl+Alt+Del (Unlock/Login Windows)"
              className="px-2.5 py-1 text-xs font-mono font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors disabled:opacity-40"
            >
              <KeyRound className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Ctrl+Alt+Del</span>
            </button>

            {/* Win Key Button */}
            <button
              onClick={sendWindowsKey}
              disabled={connectionStatus !== 'connected'}
              title="Send Windows Start Key"
              className="px-2.5 py-1 text-xs font-mono font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors disabled:opacity-40"
            >
              <span className="text-sky-400 font-bold">⊞</span>
              <span className="hidden sm:inline">Start</span>
            </button>

            {/* Clipboard Paste Tool */}
            <button
              onClick={() => setShowClipboardBar((prev) => !prev)}
              disabled={connectionStatus !== 'connected'}
              title="Send text to guest clipboard"
              className={`p-1.5 rounded-md text-slate-300 hover:text-white border transition-colors ${
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
              className="px-2 py-1 text-xs font-medium rounded-md bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 flex items-center gap-1 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">.RDP File</span>
            </button>

            {/* Reconnect button */}
            <button
              onClick={connectSession}
              title="Reconnect Desktop Session"
              className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* Fullscreen toggle */}
            <button
              onClick={() => setIsFullscreen((prev) => !prev)}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              title="Close Console"
              className="p-1.5 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Optional Clipboard Drawer */}
        {showClipboardBar && (
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs">
            <Clipboard className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="text-slate-400 whitespace-nowrap">Paste to Windows:</span>
            <input
              type="text"
              value={clipboardText}
              onChange={(e) => setClipboardText(e.target.value)}
              placeholder="Paste password or command here, then press Send..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-1 text-slate-100 placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-sky-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') sendClipboardTextToGuest();
              }}
            />
            <button
              onClick={sendClipboardTextToGuest}
              className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-medium transition-colors"
            >
              Send
            </button>
          </div>
        )}

        {/* Main Display Canvas Container */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
          {/* Guacamole canvas target element */}
          <div
            ref={displayContainerRef}
            className="w-full h-full flex items-center justify-center cursor-default outline-none select-none"
            tabIndex={0}
          />

          {/* Loading / Connecting Overlay */}
          {connectionStatus === 'connecting' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm z-10">
              <div className="w-12 h-12 rounded-full border-2 border-sky-500/20 border-t-sky-400 animate-spin mb-4" />
              <p className="text-sm font-medium text-white mb-1">
                Connecting to Windows Desktop...
              </p>
              <p className="text-xs text-slate-400">
                Establishing HTML5 RDP bridge via Guacamole gateway
              </p>
            </div>
          )}

          {/* Disconnected / Error Overlay */}
          {(connectionStatus === 'disconnected' || connectionStatus === 'error') && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-sm z-10 p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1">
                {connectionStatus === 'error' ? 'Connection Error' : 'Desktop Session Ended'}
              </h3>
              <p className="text-xs text-slate-400 max-w-md mb-4">
                {errorMessage ||
                  'The remote desktop connection was terminated or the Windows instance is still booting up.'}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={connectSession}
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-sky-600/20"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Try Again
                </button>
                <button
                  onClick={downloadRdpFile}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-2 border border-slate-700 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Open in Native RDP
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Security & Helper Footer */}
        <div className="flex items-center justify-between px-4 py-1.5 bg-slate-950 border-t border-slate-800/80 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted HTML5 RDP Bridge</span>
            <span className="text-slate-700">|</span>
            <span>Zero Client Software Required</span>
          </div>
          <div className="flex items-center gap-3">
            <span>
              Tip: Press <kbd className="px-1 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-400">Ctrl+Alt+Del</kbd> above to unlock screen
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
