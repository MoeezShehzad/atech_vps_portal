import React, { useRef, useEffect } from 'react';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  hasError?: boolean;
}

export default function OtpInput({
  length = 6,
  value = '',
  onChange,
  onComplete,
  disabled = false,
  autoFocus = true,
  hasError = false,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Array of single characters
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  useEffect(() => {
    if (autoFocus && inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus, disabled]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const rawChar = e.target.value;
    // Accept only digits
    const cleaned = rawChar.replace(/\D/g, '');

    if (!cleaned) {
      // Deletion / empty
      const nextArr = [...digits];
      nextArr[index] = '';
      const nextVal = nextArr.join('');
      onChange(nextVal);
      return;
    }

    // Single digit entry
    const char = cleaned.slice(-1);
    const nextArr = [...digits];
    nextArr[index] = char;
    const nextVal = nextArr.join('');
    onChange(nextVal);

    // Auto-advance to next slot
    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      inputRefs.current[index + 1]?.select();
    }

    if (nextVal.length === length && onComplete) {
      onComplete(nextVal);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        // Move back to previous slot on backspace when current slot is empty
        inputRefs.current[index - 1]?.focus();
        inputRefs.current[index - 1]?.select();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
      inputRefs.current[index - 1]?.select();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
      inputRefs.current[index + 1]?.select();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pastedData) return;

    onChange(pastedData);

    const targetIndex = Math.min(pastedData.length, length - 1);
    inputRefs.current[targetIndex]?.focus();
    inputRefs.current[targetIndex]?.select();

    if (pastedData.length === length && onComplete) {
      onComplete(pastedData);
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 w-full" onPaste={handlePaste}>
      {digits.map((digit, idx) => {
        const isFilled = Boolean(digit);
        return (
          <input
            key={idx}
            ref={(el) => { inputRefs.current[idx] = el; }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            disabled={disabled}
            onChange={(e) => handleChange(e, idx)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            onFocus={(e) => e.target.select()}
            className={`w-11 h-14 sm:w-13 sm:h-16 text-center text-xl sm:text-2xl font-mono font-bold rounded-xl border transition-all duration-200 outline-none select-none ${
              hasError
                ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 ring-2 ring-rose-500/20'
                : isFilled
                ? 'border-blue-600 dark:border-blue-500 bg-blue-50/30 dark:bg-blue-950/30 text-blue-950 dark:text-white shadow-xs'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white hover:border-slate-300 dark:hover:border-slate-600'
            } focus:border-blue-600 dark:focus:border-blue-500 focus:ring-3 focus:ring-blue-600/15 disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-label={`Digit ${idx + 1}`}
          />
        );
      })}
    </div>
  );
}
