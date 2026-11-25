import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebglAddon } from '@xterm/addon-webgl';
import { SearchAddon } from '@xterm/addon-search';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import {
  X,
  Maximize2,
  Minimize2,
  Minus,
  RefreshCw,
  Terminal as TerminalIcon,
  Search,
  ChevronUp,
  ChevronDown,
  Copy,
  Check,
  Download,
  Eraser,
  AArrowDown,
  AArrowUp,
} from 'lucide-react';
import { apiCall } from '../services/api';

interface WebConsoleModalProps {
  vmId?: number | string;
  siteId?: number | string;
  vmName?: string;
  siteName?: string;
  vmIp?: string;
  adminUser?: string;
  adminPassword?: string;
  standalone?: boolean;
  onClose: () => void;
  onSessionEnd?: () => void;
}

export default function WebConsoleModal({
  vmId,
  siteId,
  vmName,
  siteName,
  vmIp,
  adminUser: initialUser = 'ubuntu',
  adminPassword: initialPassword = 'root',
  standalone = false,
  onClose,
  onSessionEnd,
}: WebConsoleModalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermInstance = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const webglAddonRef = useRef<WebglAddon | null>(null);
  const searchAddonRef = useRef<SearchAddon | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const httpSessionIdRef = useRef<string | null>(null);
  const httpUseSseRef = useRef<boolean>(false);
  const httpInputBufferRef = useRef<string>('');
  const httpFlushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingInputQueue = useRef<string[]>([]);

  const displayName = siteName || vmName || 'Web Terminal';

  const onSessionEndRef = useRef(onSessionEnd);
  useEffect(() => {
    onSessionEndRef.current = onSessionEnd;
  }, [onSessionEnd]);

  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [transportMode, setTransportMode] = useState<'ws' | 'sse' | 'http' | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [rendererMode, setRendererMode] = useState<'webgl' | 'dom'>('dom');
  const [fontSize, setFontSize] = useState<number>(standalone ? 14 : 13);
  const [sizeBadge, setSizeBadge] = useState<string | null>(null);
  const sizeBadgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchCaseSensitive, setSearchCaseSensitive] = useState<boolean>(false);
  const [searchNotFound, setSearchNotFound] = useState<boolean>(false);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const isMountedRef = useRef(true);

  useEffect(() => {
    if (standalone) {
      document.title = `${displayName} — ATC Terminal`;
    }
  }, [standalone, displayName]);

  const flashSizeBadge = useCallback((cols: number, rows: number) => {
    if (!cols || !rows) return;
    setSizeBadge(`${cols}×${rows}`);
    if (sizeBadgeTimerRef.current) clearTimeout(sizeBadgeTimerRef.current);
    sizeBadgeTimerRef.current = setTimeout(() => {
      if (isMountedRef.current) setSizeBadge(null);
    }, 900);
  }, []);

  const extractBufferText = useCallback((): string => {
    const term = xtermInstance.current;
    if (!term) return '';
    const buffer = term.buffer.active;
    const lines: string[] = [];
    for (let i = 0; i < buffer.length; i++) {
      const line = buffer.getLine(i);
      if (line) {
        lines.push(line.translateToString(true));
      }
    }
    // Trim trailing empty lines
    while (lines.length > 0 && lines[lines.length - 1] === '') {
      lines.pop();
    }
    return lines.join('\n');
  }, []);

  const syncTerminalSize = useCallback((showOverlay = false) => {
    const term = xtermInstance.current;
    const fitAddon = fitAddonRef.current;
    if (!term || !fitAddon) return;
    try {
      fitAddon.fit();
      if (term.cols && term.rows) {
        if (showOverlay) {
          flashSizeBadge(term.cols, term.rows);
        }
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
        } else if (httpSessionIdRef.current) {
          apiCall('/ws/terminal-http', {
            method: 'POST',
            body: JSON.stringify({
              action: httpUseSseRef.current ? 'input' : 'poll',
              sessionId: httpSessionIdRef.current,
              resize: { cols: term.cols, rows: term.rows },
            }),
          }).catch(() => {});
        }
      }
    } catch {}
  }, [flashSizeBadge]);

  const handleFontSizeChange = useCallback(
    (delta: number) => {
      setFontSize((prev) => {
        const next = Math.min(36, Math.max(10, prev + delta));
        if (xtermInstance.current && next !== prev) {
          xtermInstance.current.options.fontSize = next;
          requestAnimationFrame(() => syncTerminalSize(true));
        }
        return next;
      });
    },
    [syncTerminalSize]
  );

  const handleFontSizeReset = useCallback(() => {
    const defaultSize = standalone ? 14 : 13;
    setFontSize(defaultSize);
    if (xtermInstance.current) {
      xtermInstance.current.options.fontSize = defaultSize;
      requestAnimationFrame(() => syncTerminalSize(true));
    }
  }, [standalone, syncTerminalSize]);

  const handleClearScreen = useCallback(() => {
    if (xtermInstance.current) {
      xtermInstance.current.clear();
      xtermInstance.current.focus();
    }
  }, []);

  const handleCopyAll = useCallback(async () => {
    const text = extractBufferText();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 1500);
    } catch {}
    xtermInstance.current?.focus();
  }, [extractBufferText]);

  const handleDownloadLog = useCallback(() => {
    const text = extractBufferText();
    const safeName = displayName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const blob = new Blob([text || '(empty console buffer)\n'], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeName}-console-${stamp}.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    xtermInstance.current?.focus();
  }, [extractBufferText, displayName]);

  const openSearchBar = useCallback(() => {
    setShowSearch(true);
    setTimeout(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    }, 20);
  }, []);

  const closeSearchBar = useCallback(() => {
    setShowSearch(false);
    setSearchNotFound(false);
    try {
      searchAddonRef.current?.clearDecorations();
    } catch {}
    xtermInstance.current?.focus();
  }, []);

  const runSearch = useCallback(
    (query: string, direction: 'next' | 'prev' = 'next', caseSensitive = searchCaseSensitive) => {
      if (!searchAddonRef.current) return;
      if (!query) {
        setSearchNotFound(false);
        try {
          searchAddonRef.current.clearDecorations();
        } catch {}
        return;
      }
      const opts = {
        caseSensitive,
        incremental: direction === 'next',
        decorations: {
          matchBackground: '#334155',
          matchBorder: '#64748b',
          matchOverviewRuler: '#38bdf8',
          activeMatchBackground: '#0284c7',
          activeMatchBorder: '#38bdf8',
          activeMatchColorOverviewRuler: '#38bdf8',
        },
      };
      const found =
        direction === 'prev'
          ? searchAddonRef.current.findPrevious(query, { ...opts, incremental: false })
          : searchAddonRef.current.findNext(query, opts);
      setSearchNotFound(!found);
    },
    [searchCaseSensitive]
  );

  const flushHttpInput = useCallback(async () => {
    const sid = httpSessionIdRef.current;
    const chunk = httpInputBufferRef.current;
    if (!sid || !chunk) return;
    httpInputBufferRef.current = '';
    try {
      const res = await apiCall('/ws/terminal-http', {
        method: 'POST',
        body: JSON.stringify({
          action: httpUseSseRef.current ? 'input' : 'poll',
          sessionId: sid,
          input: chunk,
        }),
      });
      if (!isMountedRef.current) return;
      if (res?.output && xtermInstance.current) {
        xtermInstance.current.write(res.output);
      }
      if (res?.closed) {
        httpSessionIdRef.current = null;
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
        setConnectionStatus('disconnected');
        onSessionEndRef.current?.();
      }
    } catch {}
  }, []);

  const startHttpFallbackSession = useCallback(
    async (ticket: string) => {
      if (!xtermInstance.current || !isMountedRef.current) return;
      const term = xtermInstance.current;
      try {
        const openRes = await apiCall('/ws/terminal-http', {
          method: 'POST',
          body: JSON.stringify({
            action: 'open',
            ticket,
            vmId,
            siteId,
            cols: term.cols || 100,
            rows: term.rows || 30,
          }),
        });
        if (!isMountedRef.current) return;
        if (!openRes || !openRes.sessionId) {
          throw new Error(openRes?.error || 'HTTPS terminal fallback failed to initialize.');
        }

        const sid = openRes.sessionId;
        httpSessionIdRef.current = sid;
        setConnectionStatus('connected');

        if (openRes.output) {
          term.write(openRes.output);
        }

        try {
          fitAddonRef.current?.fit();
          term.focus();
          terminalRef.current?.querySelector<HTMLTextAreaElement>('.xterm-helper-textarea')?.focus();
        } catch {}

        while (pendingInputQueue.current.length > 0) {
          const item = pendingInputQueue.current.shift();
          if (item) httpInputBufferRef.current += item;
        }
        if (httpInputBufferRef.current) {
          flushHttpInput();
        }

        const startPollLoop = async () => {
          httpUseSseRef.current = false;
          setTransportMode('http');
          while (isMountedRef.current && httpSessionIdRef.current === sid) {
            try {
              const res = await apiCall('/ws/terminal-http', {
                method: 'POST',
                body: JSON.stringify({ action: 'poll', sessionId: sid, waitMs: 6000 }),
              });
              if (!isMountedRef.current || httpSessionIdRef.current !== sid) break;
              if (res?.output && xtermInstance.current) {
                xtermInstance.current.write(res.output);
              }
              if (res?.closed) {
                httpSessionIdRef.current = null;
                setConnectionStatus('disconnected');
                onSessionEndRef.current?.();
                break;
              }
            } catch {
              await new Promise((r) => setTimeout(r, 400));
            }
          }
        };

        // Prefer real-time SSE streaming over repeated HTTP POST polling
        if (typeof EventSource !== 'undefined') {
          try {
            const es = new EventSource(`/api/ws/terminal-http/stream?sessionId=${encodeURIComponent(sid)}`);
            eventSourceRef.current = es;
            httpUseSseRef.current = true;
            setTransportMode('sse');
            let sseConnected = false;

            es.onopen = () => {
              sseConnected = true;
            };

            es.onmessage = (evt) => {
              if (!isMountedRef.current || httpSessionIdRef.current !== sid) return;
              try {
                const payload = JSON.parse(evt.data);
                if (payload.o && xtermInstance.current) {
                  xtermInstance.current.write(payload.o);
                }
                if (payload.closed) {
                  es.close();
                  eventSourceRef.current = null;
                  httpSessionIdRef.current = null;
                  setConnectionStatus('disconnected');
                  onSessionEndRef.current?.();
                }
              } catch {}
            };

            es.onerror = () => {
              if (!sseConnected && isMountedRef.current && httpSessionIdRef.current === sid) {
                es.close();
                eventSourceRef.current = null;
                startPollLoop();
              }
            };
            return;
          } catch {}
        }

        startPollLoop();
      } catch (err: any) {
        if (!isMountedRef.current) return;
        setConnectionStatus('disconnected');
        term.write(`\r\n\x1b[31m[Console Error]\x1b[0m ${err.message || 'Connection to SSH terminal gateway failed.'}\r\n`);
      }
    },
    [vmId, siteId, flushHttpInput]
  );

  // Stable connect / reconnect function
  const connectSession = useCallback(async () => {
    if (!xtermInstance.current || !isMountedRef.current) return;
    const term = xtermInstance.current;

    // Close any previous socket, SSE stream, ping timer, or HTTP fallback session cleanly
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.onclose = null;
      socketRef.current.close();
      socketRef.current = null;
    }
    if (httpSessionIdRef.current) {
      const oldSid = httpSessionIdRef.current;
      httpSessionIdRef.current = null;
      httpUseSseRef.current = false;
      apiCall('/ws/terminal-http', {
        method: 'POST',
        body: JSON.stringify({ action: 'close', sessionId: oldSid }),
      }).catch(() => {});
    }

    setConnectionStatus('connecting');
    setTransportMode(null);
    setLatencyMs(null);
    term.write('\r\n\x1b[36m[Console]\x1b[0m Requesting secure session ticket...\r\n');

    try {
      let session: any;
      let wsUrl = '';
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;

      if (siteId) {
        session = await apiCall(`/sites/${siteId}/console-session`, { method: 'POST' });
        if (!isMountedRef.current) return;
        if (!session || !session.ticket) {
          throw new Error(session?.error || 'Failed to obtain container console session ticket.');
        }
        term.write(`\x1b[32m[Console]\x1b[0m Ticket granted. Attaching to container sandbox (site_${siteId})...\r\n`);
        wsUrl = `${protocol}//${host}/api/ws/terminal?ticket=${encodeURIComponent(session.ticket)}&siteId=${siteId}`;
      } else {
        session = await apiCall(`/vms/${vmId}/console-session`, { method: 'POST' });
        if (!isMountedRef.current) return;
        if (!session || !session.ticket) {
          throw new Error(session?.error || 'Failed to obtain console session ticket.');
        }
        term.write(`\x1b[32m[Console]\x1b[0m Ticket granted. Establishing SSH bridge to ${session.ip || vmIp}...\r\n`);
        wsUrl = `${protocol}//${host}/api/ws/terminal?ticket=${encodeURIComponent(session.ticket)}&vmId=${vmId}`;
      }

      const ws = new WebSocket(wsUrl);
      ws.binaryType = 'arraybuffer';
      socketRef.current = ws;
      let wsOpened = false;
      let fallbackTriggered = false;

      const triggerHttpFallback = () => {
        if (fallbackTriggered || !isMountedRef.current) return;
        fallbackTriggered = true;
        socketRef.current = null;
        startHttpFallbackSession(session.ticket);
      };

      ws.onopen = () => {
        wsOpened = true;
        if (!isMountedRef.current) return;
        setConnectionStatus('connected');
        setTransportMode('ws');

        // Immediate fit, focus & PTY size sync
        try {
          fitAddonRef.current?.fit();
          term.focus();
          terminalRef.current?.querySelector<HTMLTextAreaElement>('.xterm-helper-textarea')?.focus();
          if (term.cols && term.rows && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
          }
        } catch {}

        // Flush any early typed keystrokes while ticket was granting or WS was connecting
        while (pendingInputQueue.current.length > 0) {
          const item = pendingInputQueue.current.shift();
          if (item && ws.readyState === WebSocket.OPEN) {
            ws.send(item);
          }
        }

        // Measure live WebSocket RTT every 10s
        const sendPing = () => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping', t: Date.now() }));
          }
        };
        sendPing();
        pingIntervalRef.current = setInterval(sendPing, 10000);
      };

      let initialPromptFocused = false;
      ws.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
          // Fast path: raw binary SSH output directly into xterm without UTF-8 re-encoding
          term.write(new Uint8Array(event.data));
        } else if (typeof event.data === 'string') {
          if (event.data.charCodeAt(0) === 123 && event.data.startsWith('{"type":"pong"')) {
            try {
              const parsed = JSON.parse(event.data);
              if (typeof parsed.t === 'number') {
                setLatencyMs(Math.max(1, Date.now() - parsed.t));
              }
              return;
            } catch {}
          }
          term.write(event.data);
        }

        if (!initialPromptFocused) {
          initialPromptFocused = true;
          try {
            term.focus();
            terminalRef.current?.querySelector<HTMLTextAreaElement>('.xterm-helper-textarea')?.focus();
          } catch {}
        }
      };

      ws.onerror = (err) => {
        console.warn('[WebConsole] WebSocket error:', err);
        if (!isMountedRef.current) return;
        if (!wsOpened) {
          ws.onclose = null;
          triggerHttpFallback();
          return;
        }
        setConnectionStatus('disconnected');
        term.write('\r\n\x1b[31m[WebSocket Error] Connection to SSH terminal gateway failed.\x1b[0m\r\n');
      };

      ws.onclose = () => {
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
        if (!isMountedRef.current) return;
        if (!wsOpened) {
          triggerHttpFallback();
          return;
        }
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
  }, [vmId, siteId, vmIp, startHttpFallbackSession]);

  // Terminal instance initialization — runs strictly ONCE when modal opens
  useEffect(() => {
    isMountedRef.current = true;
    if (!terminalRef.current) return;
    const currentContainer = terminalRef.current;

    const term = new XTerm({
      cursorBlink: true,
      cursorStyle: 'block',
      fontSize: standalone ? 14 : 13,
      lineHeight: 1.25,
      scrollback: 3000,
      scrollSensitivity: 3,
      fastScrollSensitivity: 5,
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
    const searchAddon = new SearchAddon();
    const webLinksAddon = new WebLinksAddon((_event, uri) => {
      window.open(uri, '_blank', 'noopener,noreferrer');
    });
    term.loadAddon(fitAddon);
    term.loadAddon(searchAddon);
    term.loadAddon(webLinksAddon);
    currentContainer.innerHTML = '';
    term.open(currentContainer);

    searchAddonRef.current = searchAddon;

    // Enable GPU-accelerated WebGL rendering with automatic DOM fallback
    try {
      const webglAddon = new WebglAddon();
      webglAddon.onContextLoss(() => {
        try {
          webglAddon.dispose();
        } catch {}
        webglAddonRef.current = null;
        if (isMountedRef.current) setRendererMode('dom');
      });
      term.loadAddon(webglAddon);
      webglAddonRef.current = webglAddon;
      setRendererMode('webgl');
    } catch {
      webglAddonRef.current = null;
      setRendererMode('dom');
    }

    xtermInstance.current = term;
    fitAddonRef.current = fitAddon;

    // Focus helper (no forced layout reflow)
    const triggerFocus = () => {
      try {
        term.focus();
        currentContainer.querySelector<HTMLTextAreaElement>('.xterm-helper-textarea')?.focus();
      } catch {}
    };

    // Forward keystrokes to remote SSH stdin (WebSocket or HTTPS Fallback) or buffer if still connecting
    const onDataDisposable = term.onData((data) => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(data);
      } else if (httpSessionIdRef.current) {
        httpInputBufferRef.current += data;
        if (httpFlushTimerRef.current) clearTimeout(httpFlushTimerRef.current);
        httpFlushTimerRef.current = setTimeout(() => {
          flushHttpInput();
        }, 4);
      } else {
        pendingInputQueue.current.push(data);
      }
    });

    // Handle Ctrl+F (Search), Ctrl++/-/0 (Zoom), Ctrl+C (Copy if selected), Ctrl+V (Paste)
    term.attachCustomKeyEventHandler((event: KeyboardEvent) => {
      // 0. Search: Ctrl+F / Cmd+F
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
        if (event.type === 'keydown') {
          event.preventDefault();
          openSearchBar();
        }
        return false;
      }

      // 0b. Zoom In / Out / Reset: Ctrl++ / Ctrl+= / Ctrl+- / Ctrl+0
      if (event.ctrlKey || event.metaKey) {
        if (event.key === '+' || event.key === '=' || event.code === 'NumpadAdd') {
          if (event.type === 'keydown') {
            event.preventDefault();
            handleFontSizeChange(2);
          }
          return false;
        }
        if (event.key === '-' || event.key === '_' || event.code === 'NumpadSubtract') {
          if (event.type === 'keydown') {
            event.preventDefault();
            handleFontSizeChange(-2);
          }
          return false;
        }
        if (event.key === '0' || event.code === 'Numpad0') {
          if (event.type === 'keydown') {
            event.preventDefault();
            handleFontSizeReset();
          }
          return false;
        }
      }

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

    // Container interaction focus & Ctrl+Wheel zoom listeners
    const handlePointerFocus = () => {
      triggerFocus();
    };
    const handleWheelZoom = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        handleFontSizeChange(e.deltaY < 0 ? 2 : -2);
      }
    };
    const handleGlobalKeyZoom = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === '+' || e.key === '=' || e.code === 'NumpadAdd') {
        e.preventDefault();
        handleFontSizeChange(2);
      } else if (e.key === '-' || e.key === '_' || e.code === 'NumpadSubtract') {
        e.preventDefault();
        handleFontSizeChange(-2);
      } else if (e.key === '0' || e.code === 'Numpad0') {
        e.preventDefault();
        handleFontSizeReset();
      }
    };
    currentContainer.addEventListener('mousedown', handlePointerFocus);
    currentContainer.addEventListener('wheel', handleWheelZoom, { passive: false });
    window.addEventListener('keydown', handleGlobalKeyZoom);

    let lastCols = 0;
    let lastRows = 0;
    let hasInitialFit = false;
    let resizeDebounceTimer: ReturnType<typeof setTimeout> | null = null;
    const sendResize = () => {
      try {
        fitAddon.fit();
        if (term.cols && term.rows && (term.cols !== lastCols || term.rows !== lastRows)) {
          lastCols = term.cols;
          lastRows = term.rows;
          if (hasInitialFit) {
            flashSizeBadge(term.cols, term.rows);
          }
          hasInitialFit = true;
          if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
          } else if (httpSessionIdRef.current) {
            apiCall('/ws/terminal-http', {
              method: 'POST',
              body: JSON.stringify({
                action: httpUseSseRef.current ? 'input' : 'poll',
                sessionId: httpSessionIdRef.current,
                resize: { cols: term.cols, rows: term.rows },
              }),
            }).catch(() => {});
          }
        }
      } catch {}
    };

    const scheduleResize = () => {
      if (resizeDebounceTimer) clearTimeout(resizeDebounceTimer);
      resizeDebounceTimer = setTimeout(() => {
        requestAnimationFrame(sendResize);
      }, 60);
    };

    // Debounced ResizeObserver avoids reflow thrashing during CSS modal/fullscreen transitions
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const entry = entries[0];
      if (entry.contentRect.width > 50 && entry.contentRect.height > 50) {
        scheduleResize();
      }
    });
    resizeObserver.observe(currentContainer);

    const handleWindowResize = () => {
      scheduleResize();
    };
    window.addEventListener('resize', handleWindowResize);

    // One-time initial fit & focus
    requestAnimationFrame(() => {
      sendResize();
      triggerFocus();
    });

    // Initial connection
    connectSession();

    return () => {
      isMountedRef.current = false;
      if (resizeDebounceTimer) clearTimeout(resizeDebounceTimer);
      if (httpFlushTimerRef.current) clearTimeout(httpFlushTimerRef.current);
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (sizeBadgeTimerRef.current) clearTimeout(sizeBadgeTimerRef.current);
      window.removeEventListener('resize', handleWindowResize);
      window.removeEventListener('keydown', handleGlobalKeyZoom);
      window.removeEventListener('paste', handleNativePaste);
      currentContainer.removeEventListener('paste', handleNativePaste);
      currentContainer.removeEventListener('contextmenu', handleContextMenu);
      currentContainer.removeEventListener('mousedown', handlePointerFocus);
      currentContainer.removeEventListener('wheel', handleWheelZoom);
      resizeObserver.disconnect();
      onDataDisposable.dispose();
      if (socketRef.current) {
        socketRef.current.onclose = null;
        socketRef.current.close();
      }
      if (httpSessionIdRef.current) {
        const sid = httpSessionIdRef.current;
        httpSessionIdRef.current = null;
        apiCall('/ws/terminal-http', {
          method: 'POST',
          body: JSON.stringify({ action: 'close', sessionId: sid }),
        }).catch(() => {});
      }
      try {
        webglAddonRef.current?.dispose();
        webglAddonRef.current = null;
      } catch {}
      term.dispose();
    };
  }, [vmId, siteId]); // Strictly runs once per target session

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
      {/* 1. MINIMIZED FLOATING DOCK BADGE (modal mode only) */}
      {!standalone && isMinimized && (
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
              <span className="text-xs font-bold text-white font-mono">{displayName}</span>
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

      {/* 2. FULL / RESTORED CONSOLE MODAL OR STANDALONE WINDOW */}
      <div 
        className={
          standalone
            ? 'fixed inset-0 w-screen h-screen bg-[#090d16] flex flex-col overflow-hidden'
            : `fixed inset-0 z-[120] transition-opacity duration-150 ${
                isMinimized 
                  ? 'pointer-events-none opacity-0' 
                  : 'bg-slate-950/85 flex items-center justify-center p-3 md:p-6 opacity-100'
              }`
        }
      >
        <div 
          className={
            standalone
              ? 'bg-[#090d16] w-full h-full flex flex-col overflow-hidden'
              : `bg-[#090d16] border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
                  isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-5xl h-[82vh] min-h-[520px]'
                }`
          }
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
                {displayName}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {/* Search (Ctrl+F) */}
              <button
                onClick={() => (showSearch ? closeSearchBar() : openSearchBar())}
                title="Search Output (Ctrl+F)"
                className={`p-1.5 rounded-lg transition-all ${
                  showSearch
                    ? 'text-sky-400 bg-sky-500/15'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
              </button>

              {/* Font Size Controls (A- / A+ / Ctrl+0 Reset) */}
              <div className="flex items-center bg-slate-800/70 rounded-lg border border-slate-700/60 px-0.5 mx-0.5">
                <button
                  onClick={() => handleFontSizeChange(-2)}
                  disabled={fontSize <= 10}
                  title="Zoom Out (Ctrl + -)"
                  className="p-1 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                >
                  <AArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleFontSizeReset}
                  title="Reset Zoom (Ctrl + 0)"
                  className="text-[10px] font-mono text-slate-300 hover:text-white px-1 min-w-[26px] text-center transition-colors"
                >
                  {fontSize}
                </button>
                <button
                  onClick={() => handleFontSizeChange(2)}
                  disabled={fontSize >= 36}
                  title="Zoom In (Ctrl + +)"
                  className="p-1 text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                >
                  <AArrowUp className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Clear Screen */}
              <button
                onClick={handleClearScreen}
                title="Clear Screen"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
              >
                <Eraser className="w-3.5 h-3.5" />
              </button>

              {/* Copy All */}
              <button
                onClick={handleCopyAll}
                title={copiedAll ? 'Copied!' : 'Copy All Output'}
                className={`p-1.5 rounded-lg transition-all ${
                  copiedAll
                    ? 'text-emerald-400 bg-emerald-500/15'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {copiedAll ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              {/* Download Session Log */}
              <button
                onClick={handleDownloadLog}
                title="Download Session Log"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
              >
                <Download className="w-3.5 h-3.5" />
              </button>

              <div className="w-px h-4 bg-slate-800 mx-1" />

              <button
                onClick={handleReconnect}
                title="Reconnect Console"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              {!standalone && (
                <>
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
                      setTimeout(() => syncTerminalSize(), 150);
                    }}
                    title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                  >
                    {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  </button>
                </>
              )}

              <button
                onClick={onClose}
                title="Close Console"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all ml-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* TERMINAL CANVAS CONTAINER + FLOATING SEARCH BAR + SIZE OVERLAY */}
          <div className="relative flex-1 w-full overflow-hidden flex flex-col" style={{ minHeight: 0 }}>
            {sizeBadge && (
              <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
                <div className="bg-slate-200/90 text-slate-900 font-mono font-bold text-3xl sm:text-4xl px-6 py-3 rounded-2xl shadow-2xl tracking-tight select-none">
                  {sizeBadge}
                </div>
              </div>
            )}
            {showSearch && (
              <div className="absolute top-2 right-3 z-20 flex items-center gap-1 bg-slate-900/95 border border-slate-700 rounded-xl shadow-2xl px-2.5 py-1.5">
                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSearchQuery(val);
                    runSearch(val, 'next', searchCaseSensitive);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      runSearch(searchQuery, e.shiftKey ? 'prev' : 'next', searchCaseSensitive);
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      closeSearchBar();
                    }
                  }}
                  placeholder="Find in terminal..."
                  className={`bg-transparent text-xs font-mono text-white placeholder-slate-500 outline-none w-44 sm:w-56 ${
                    searchNotFound && searchQuery ? 'text-rose-400' : ''
                  }`}
                />
                {searchNotFound && searchQuery && (
                  <span className="text-[10px] font-mono text-rose-400 px-1">No match</span>
                )}
                <button
                  onClick={() => {
                    const nextCs = !searchCaseSensitive;
                    setSearchCaseSensitive(nextCs);
                    runSearch(searchQuery, 'next', nextCs);
                  }}
                  title="Match Case"
                  className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded transition-colors ${
                    searchCaseSensitive
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Aa
                </button>
                <button
                  onClick={() => runSearch(searchQuery, 'prev', searchCaseSensitive)}
                  title="Previous Match (Shift+Enter)"
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => runSearch(searchQuery, 'next', searchCaseSensitive)}
                  title="Next Match (Enter)"
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={closeSearchBar}
                  title="Close Search (Esc)"
                  className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div
              ref={terminalRef}
              onClick={() => {
                if (!showSearch) {
                  xtermInstance.current?.focus();
                  terminalRef.current?.querySelector<HTMLTextAreaElement>('.xterm-helper-textarea')?.focus();
                }
              }}
              onMouseDown={() => {
                if (!showSearch) {
                  xtermInstance.current?.focus();
                  terminalRef.current?.querySelector<HTMLTextAreaElement>('.xterm-helper-textarea')?.focus();
                }
              }}
              className="flex-1 w-full p-3 overflow-hidden font-mono cursor-text outline-none"
              style={{ minHeight: 0 }}
            />
          </div>

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

            <div className="flex items-center gap-3">
              {transportMode && (
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                  transportMode === 'ws'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  {transportMode === 'ws'
                    ? `WS${latencyMs !== null ? ` · ${latencyMs}ms` : ''}`
                    : transportMode === 'sse'
                    ? 'HTTP SSE'
                    : 'HTTP POLL'}
                </span>
              )}
              <span className="text-[10px] text-slate-500 uppercase">
                {rendererMode === 'webgl' ? 'WebGL GPU' : 'DOM'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
