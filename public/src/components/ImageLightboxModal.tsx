import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ImageLightboxModalProps {
  src: string | null;
  alt: string;
  caption?: string;
  onClose: () => void;
}

export default function ImageLightboxModal({
  src,
  alt,
  caption,
  onClose,
}: ImageLightboxModalProps) {
  useEffect(() => {
    if (!src) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [src, onClose]);

  if (!src || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 sm:p-6 animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={caption || alt}
    >
      <div
        className="relative max-w-2xl w-full flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          title="Close preview"
          className="absolute -top-11 right-0 w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer backdrop-blur-xs border border-white/20"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-full rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-white/15 shadow-2xl p-2 sm:p-3 flex items-center justify-center">
          <img
            src={src}
            alt={alt}
            className="max-h-[75vh] max-w-full w-auto h-auto object-contain rounded-xl"
          />
        </div>

        {caption && (
          <p className="mt-3 text-sm font-semibold text-white/95 tracking-tight text-center">
            {caption}
          </p>
        )}
      </div>
    </div>,
    document.body
  );
}
