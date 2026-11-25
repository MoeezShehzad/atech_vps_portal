import React from 'react';
import { createPortal } from 'react-dom';
import { Loader2, CheckCircle2, AlertCircle, UploadCloud, Trash2 } from 'lucide-react';

export interface MediaModalState {
  open: boolean;
  phase: 'processing' | 'success' | 'error';
  action: 'upload' | 'delete';
  title: string;
  subtitle: string;
}

interface MediaActionModalProps {
  state: MediaModalState;
  onClose?: () => void;
}

export const INITIAL_MEDIA_MODAL_STATE: MediaModalState = {
  open: false,
  phase: 'processing',
  action: 'upload',
  title: '',
  subtitle: '',
};

export function waitMinimumDuration(startTime: number, minMs: number): Promise<void> {
  const elapsed = Date.now() - startTime;
  const remaining = Math.max(0, minMs - elapsed);
  if (remaining === 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, remaining));
}

export default function MediaActionModal({ state, onClose }: MediaActionModalProps) {
  if (!state.open || typeof document === 'undefined') return null;

  const isDelete = state.action === 'delete';

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/45 backdrop-blur-[2px] p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-live="polite"
    >
      <div className="w-full max-w-xs sm:max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl p-6 text-center space-y-4">
        {/* Status Icon */}
        <div className="flex justify-center">
          {state.phase === 'processing' && (
            <div
              className={`relative w-14 h-14 rounded-2xl flex items-center justify-center border ${
                isDelete
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-900/60 text-rose-600 dark:text-rose-400'
                  : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200/80 dark:border-blue-900/60 text-blue-600 dark:text-blue-400'
              }`}
            >
              <Loader2 className="w-7 h-7 animate-spin" />
              <span
                className={`absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-white shadow-sm ${
                  isDelete ? 'bg-rose-600' : 'bg-blue-600'
                }`}
              >
                {isDelete ? <Trash2 className="w-3 h-3" /> : <UploadCloud className="w-3 h-3" />}
              </span>
            </div>
          )}

          {state.phase === 'success' && (
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
          )}

          {state.phase === 'error' && (
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-8 h-8" />
            </div>
          )}
        </div>

        {/* Text */}
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
            {state.title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {state.subtitle}
          </p>
        </div>

        {/* Smooth Progress Indicator */}
        {state.phase === 'processing' && (
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full w-2/3 rounded-full animate-pulse ${
                isDelete ? 'bg-rose-500' : 'bg-blue-600'
              }`}
            />
          </div>
        )}

        {state.phase === 'success' && (
          <div className="w-full h-1.5 bg-emerald-100 dark:bg-emerald-950/60 rounded-full overflow-hidden">
            <div className="h-full w-full rounded-full bg-emerald-500 transition-all duration-300" />
          </div>
        )}

        {state.phase === 'error' && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
          >
            Close
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}
