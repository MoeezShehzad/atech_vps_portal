import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, Check, Loader2 } from 'lucide-react';

export interface CountryOption {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
  phoneFormat?: string;
  currency?: string;
}

// ==============================================================================
// 1. Modern Material-Outlined Floating Label Input
// ==============================================================================
interface ModernFloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  error?: string;
  required?: boolean;
}

export function ModernFloatingInput({
  label,
  icon,
  rightElement,
  error,
  required,
  value,
  id,
  className = '',
  onFocus,
  onBlur,
  ...props
}: ModernFloatingInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputId = id || `floating-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  const hasValue = value !== undefined && value !== null && String(value).length > 0;
  const isFloated = isFocused || hasValue;

  return (
    <div className="relative w-full group">
      <div
        className={`relative flex items-center bg-white border rounded-xl transition-all duration-200 ${
          error
            ? 'border-rose-400 ring-2 ring-rose-500/10'
            : isFocused
            ? 'border-blue-600 ring-3 ring-blue-600/15 shadow-sm'
            : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        {/* Left Icon */}
        {icon && (
          <div
            className={`pl-3.5 pr-1 flex items-center pointer-events-none transition-colors ${
              error ? 'text-rose-500' : isFocused ? 'text-blue-600' : 'text-slate-400'
            }`}
          >
            {icon}
          </div>
        )}

        {/* Input */}
        <input
          id={inputId}
          value={value}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          className={`w-full bg-transparent px-3.5 py-3 text-sm text-slate-900 placeholder-transparent focus:outline-none ${className}`}
          placeholder={label}
          {...props}
        />

        {/* Floating Label */}
        <label
          htmlFor={inputId}
          className={`absolute pointer-events-none transition-all duration-150 ease-out origin-top-left ${
            icon ? (isFloated ? 'left-3' : 'left-10') : 'left-3.5'
          } ${
            isFloated
              ? '-top-2.5 px-1.5 bg-white text-[11px] font-semibold leading-none rounded z-10'
              : 'top-3.5 text-sm font-normal text-slate-500'
          } ${
            error
              ? 'text-rose-600'
              : isFocused
              ? 'text-blue-600'
              : isFloated
              ? 'text-slate-700'
              : 'text-slate-500'
          }`}
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>

        {/* Right Action (e.g. Eye toggle) */}
        {rightElement && (
          <div className="pr-3 flex items-center">{rightElement}</div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-[11px] text-rose-600 font-medium pl-1 animate-fadeIn">
          {error}
        </p>
      )}
    </div>
  );
}

// ==============================================================================
// 2. Advanced Searchable Country Combobox (Matches Screenshot)
// ==============================================================================
interface ModernCountrySelectProps {
  label: string;
  countries: CountryOption[];
  selectedCode: string;
  onSelect: (country: CountryOption) => void;
  loading?: boolean;
}

// Flag rendering helper with fallback to emoji
export function CountryFlag({ code, flag, name, className = "w-5 h-3.5" }: { code: string; flag?: string; name?: string; className?: string }) {
  const [imgError, setImgError] = useState(false);
  const cleanCode = (code || '').trim().toLowerCase();

  if (cleanCode && cleanCode.length === 2 && !imgError) {
    return (
      <img
        src={`https://flagcdn.com/w40/${cleanCode}.png`}
        alt={name || code}
        className={`${className} object-cover rounded-sm inline-block shadow-xs shrink-0`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <span className="text-base shrink-0 leading-none" role="img" aria-label={name || code}>
      {flag || code}
    </span>
  );
}

export function ModernCountrySelect({
  label,
  countries,
  selectedCode,
  onSelect,
  loading = false,
}: ModernCountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedCountry = useMemo(() => {
    return countries.find((c) => c.code.toLowerCase() === selectedCode.toLowerCase()) || countries[0];
  }, [countries, selectedCode]);

  // Filter and rank countries by relevance
  const filteredCountries = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return countries;

    const qDigits = q.replace(/[^0-9]/g, '');

    return countries
      .filter((c) => {
        const name = (c.name || '').toLowerCase();
        const code = (c.code || '').toLowerCase();
        const dialDigits = (c.dialCode || '').replace(/[^0-9]/g, '');

        if (name.includes(q)) return true;
        if (code === q) return true;
        if (qDigits.length >= 2 && dialDigits.startsWith(qDigits)) return true;
        return false;
      })
      .sort((a, b) => {
        const aName = (a.name || '').toLowerCase();
        const bName = (b.name || '').toLowerCase();

        // 1. Exact match comes first
        if (aName === q && bName !== q) return -1;
        if (bName === q && aName !== q) return 1;

        // 2. Starts with query comes second
        const aStarts = aName.startsWith(q);
        const bStarts = bName.startsWith(q);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        // 3. Alphabetical order
        return aName.localeCompare(bName);
      });
  }, [countries, searchTerm]);

  // Close when clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-focus search input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger Button with Outlined Floating Label */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex items-center justify-between w-full bg-white border rounded-xl px-3.5 py-3 cursor-pointer select-none transition-all duration-200 ${
          isOpen
            ? 'border-blue-600 ring-3 ring-blue-600/15 shadow-sm'
            : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        {/* Floating Label */}
        <span className="absolute -top-2.5 left-3 px-1.5 bg-white text-[11px] font-semibold text-slate-700 leading-none rounded z-10">
          {label} <span className="text-rose-500">*</span>
        </span>

        {/* Selected Country Display with Flag */}
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          {selectedCountry ? (
            <>
              <CountryFlag code={selectedCountry.code} flag={selectedCountry.flag} name={selectedCountry.name} />
              <span className="text-sm font-medium text-slate-900 truncate">
                {selectedCountry.name}
              </span>
              <span className="text-xs text-slate-500 font-mono shrink-0">
                ({selectedCountry.dialCode})
              </span>
            </>
          ) : (
            <span className="text-sm text-slate-400">Select Country...</span>
          )}
        </div>

        {/* Caret Indicator */}
        <div className="shrink-0 text-slate-500">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          ) : isOpen ? (
            <ChevronUp className="w-4 h-4 text-blue-600 transition-transform" />
          ) : (
            <ChevronDown className="w-4 h-4 transition-transform" />
          )}
        </div>
      </div>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden animate-fadeIn">
          {/* Search Header with Magnifier Icon */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/70">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search country, code or dial code..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Scrollable Countries List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-50">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((c, index) => {
                const isSelected = c.code.toLowerCase() === selectedCode.toLowerCase();
                return (
                  <div
                    key={`${c.code}-${c.name}-${index}`}
                    onClick={() => {
                      onSelect(c);
                      setIsOpen(false);
                    }}
                    className={`flex items-center justify-between px-3.5 py-2.5 text-sm cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50/80 text-blue-950 font-medium'
                        : 'hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <CountryFlag code={c.code} flag={c.flag} name={c.name} />
                      <span className="truncate">{c.name}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-slate-400 font-mono">{c.dialCode}</span>
                      {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-6 text-center text-xs text-slate-500">
                No countries found matching "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ==============================================================================
// 3. Advanced Searchable State/Province Combobox (Live Fetched)
// ==============================================================================
interface ModernStateSelectProps {
  label: string;
  states: string[];
  selectedState: string;
  onSelect: (state: string) => void;
  loading?: boolean;
}

export function ModernStateSelect({
  label,
  states,
  selectedState,
  onSelect,
  loading = false,
}: ModernStateSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // If country has no sub-states, allow direct typing
  const hasStatesList = states && states.length > 0;

  // Filter states
  const filteredStates = useMemo(() => {
    if (!searchTerm.trim()) return states;
    const q = searchTerm.toLowerCase();
    return states.filter((s) => s.toLowerCase().includes(q));
  }, [states, searchTerm]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  if (!hasStatesList && !loading) {
    return (
      <ModernFloatingInput
        label={label}
        value={selectedState}
        onChange={(e) => onSelect(e.target.value)}
        placeholder="Region / Province / Area"
        required
      />
    );
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger Button */}
      <div
        onClick={() => !loading && setIsOpen(!isOpen)}
        className={`relative flex items-center justify-between w-full bg-white border rounded-xl px-3.5 py-3 cursor-pointer select-none transition-all duration-200 ${
          isOpen
            ? 'border-blue-600 ring-3 ring-blue-600/15 shadow-sm'
            : 'border-slate-300 hover:border-slate-400'
        } ${loading ? 'opacity-70 cursor-wait' : ''}`}
      >
        {/* Floating Label */}
        <span className="absolute -top-2.5 left-3 px-1.5 bg-white text-[11px] font-semibold text-slate-700 leading-none rounded z-10">
          {label} <span className="text-rose-500">*</span>
        </span>

        {/* Selected State Display */}
        <div className="flex items-center gap-2 min-w-0 pr-2">
          {loading ? (
            <span className="text-sm text-slate-400 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              Loading regions...
            </span>
          ) : selectedState ? (
            <span className="text-sm font-medium text-slate-900 truncate">
              {selectedState}
            </span>
          ) : (
            <span className="text-sm text-slate-400">Select Region/State...</span>
          )}
        </div>

        {/* Caret */}
        <div className="shrink-0 text-slate-500">
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-blue-600" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </div>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden animate-fadeIn">
          {/* Search Header */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/70">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search state, province or county..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-50">
            {filteredStates.length > 0 ? (
              filteredStates.map((st) => {
                const isSelected = st === selectedState;
                return (
                  <div
                    key={st}
                    onClick={() => {
                      onSelect(st);
                      setIsOpen(false);
                    }}
                    className={`flex items-center justify-between px-3.5 py-2.5 text-sm cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50/80 text-blue-950 font-medium'
                        : 'hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <span className="truncate">{st}</span>
                    {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-6 text-center text-xs text-slate-500">
                No regions found matching "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
