// ==============================================================================
// Component: ThemeToggle.tsx
// Purpose: iOS-style animated Light / Dark mode toggle switch
// ==============================================================================

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`relative inline-flex items-center justify-between p-1 rounded-full transition-all duration-300 focus:outline-hidden ${
        isDark 
          ? 'bg-slate-800 border border-slate-700/80 shadow-inner' 
          : 'bg-slate-200/80 border border-slate-300/80 shadow-xs'
      } ${className}`}
      style={{ width: '56px', height: '28px' }}
      aria-label="Toggle theme"
    >
      {/* Sliding Knob with Spring Bezier */}
      <span
        className={`absolute top-0.5 bottom-0.5 w-6 h-6 rounded-full flex items-center justify-center transition-all shadow-md ${
          isDark
            ? 'left-[calc(100%-26px)] bg-slate-950 text-indigo-300 border border-slate-700'
            : 'left-0.5 bg-white text-amber-500 border border-slate-200'
        }`}
        style={{
          transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // iOS spring bounce
          transitionDuration: '380ms',
        }}
      >
        {isDark ? (
          <Moon className="w-3.5 h-3.5 fill-indigo-400/20" />
        ) : (
          <Sun className="w-3.5 h-3.5 fill-amber-400/20" />
        )}
      </span>

      {/* Background Icons */}
      <span className="w-full flex items-center justify-between px-1 text-[10px] pointer-events-none">
        <Sun className={`w-3 h-3 transition-opacity ${isDark ? 'opacity-30 text-slate-400' : 'opacity-0'}`} />
        <Moon className={`w-3 h-3 transition-opacity ${isDark ? 'opacity-0' : 'opacity-30 text-slate-500'}`} />
      </span>
    </button>
  );
}
