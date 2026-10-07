// ==============================================================================
// Component: Toast.tsx
// Purpose: Elegant, lightweight toast notifications (replaces raw window.alert)
// ==============================================================================

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toast: {
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
    warning: (message: string, title?: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, message: string, title?: string, duration = 4000) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newToast: ToastItem = { id, type, title, message, duration };

    setToasts((prev) => [...prev.slice(-4), newToast]); // keep max 5 toasts

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const toast = {
    success: (message: string, title?: string) => addToast('success', message, title || 'Success'),
    error: (message: string, title?: string) => addToast('error', message, title || 'Error'),
    info: (message: string, title?: string) => addToast('info', message, title || 'Information'),
    warning: (message: string, title?: string) => addToast('warning', message, title || 'Warning'),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast Render Portal */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col space-y-3 pointer-events-none max-w-sm w-full">
        {toasts.map((item) => {
          let bg = 'bg-white border-slate-200 text-slate-800';
          let Icon = Info;
          let iconColor = 'text-blue-500';

          if (item.type === 'success') {
            bg = 'bg-slate-900 border-emerald-500/30 text-white';
            Icon = CheckCircle2;
            iconColor = 'text-emerald-400';
          } else if (item.type === 'error') {
            bg = 'bg-slate-900 border-rose-500/30 text-white';
            Icon = AlertCircle;
            iconColor = 'text-rose-400';
          } else if (item.type === 'warning') {
            bg = 'bg-slate-900 border-amber-500/30 text-white';
            Icon = AlertTriangle;
            iconColor = 'text-amber-400';
          } else {
            bg = 'bg-slate-900 border-blue-500/30 text-white';
            Icon = Info;
            iconColor = 'text-blue-400';
          }

          return (
            <div
              key={item.id}
              className={`pointer-events-auto p-4 rounded-xl border shadow-xl flex items-start gap-3 backdrop-blur-md transition-all duration-300 animate-in slide-in-from-top-3 fade-in ${bg}`}
            >
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
              <div className="flex-1 text-sm min-w-0">
                {item.title && <div className="font-semibold text-xs tracking-wide uppercase opacity-80 mb-0.5">{item.title}</div>}
                <div className="text-xs leading-relaxed opacity-95 break-words">{item.message}</div>
              </div>
              <button
                type="button"
                onClick={() => removeToast(item.id)}
                className="text-slate-400 hover:text-white shrink-0 -mt-1 -mr-1 p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Graceful fallback if invoked outside ToastProvider
    return {
      toast: {
        success: (msg: string) => console.log('[Toast SUCCESS]:', msg),
        error: (msg: string) => console.error('[Toast ERROR]:', msg),
        info: (msg: string) => console.log('[Toast INFO]:', msg),
        warning: (msg: string) => console.warn('[Toast WARNING]:', msg),
      },
    };
  }
  return context;
};
