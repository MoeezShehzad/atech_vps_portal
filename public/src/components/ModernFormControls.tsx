import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, Check, Loader2 } from 'lucide-react';

export interface CountryOption {
  id?: number;
  code: string;
  name: string;
  flag: string;
  dialCode: string;
  phoneFormat?: string;
  currency?: string;
}

export interface GeoItem {
  id: number | string;
  name: string;
  code?: string;
  provinceId?: number | string;
  countryId?: number;
  countryCode?: string;
}

// ==============================================================================
// 1. Modern Material-Outlined Floating Label Input
// ==============================================================================
export interface ModernFloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
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
  placeholder,
  ...props
}: ModernFloatingInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputId = id || `floating-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  const hasValue = value !== undefined && value !== null && String(value).length > 0;
  const isFloated = isFocused || hasValue;

  return (
    <div className="relative w-full group">
      <div
        className={`relative flex items-center bg-white dark:bg-slate-900 border rounded-xl transition-all duration-200 ${
          error
            ? 'border-rose-400 ring-2 ring-rose-500/10 dark:border-rose-500'
            : isFocused
            ? 'border-blue-600 dark:border-blue-500 ring-3 ring-blue-600/15 dark:ring-blue-500/20 shadow-xs'
            : 'border-slate-300 dark:border-slate-700/80 hover:border-slate-400 dark:hover:border-slate-600'
        }`}
      >
        {/* Left Icon */}
        {icon && (
          <div
            className={`pl-3.5 pr-1 flex items-center pointer-events-none transition-colors ${
              error ? 'text-rose-500' : isFocused ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
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
          className={`w-full bg-transparent px-3.5 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none ${className}`}
          placeholder={isFloated ? (placeholder || '') : ''}
          {...props}
        />

        {/* Floating Label */}
        <label
          htmlFor={inputId}
          className={`absolute pointer-events-none transition-all duration-150 ease-out origin-top-left ${
            icon ? (isFloated ? 'left-3' : 'left-10') : 'left-3.5'
          } ${
            isFloated
              ? '-top-2.5 px-1.5 bg-white dark:bg-slate-900 text-[11px] font-semibold leading-none rounded z-10'
              : 'top-3.5 text-sm font-normal text-slate-500 dark:text-slate-400'
          } ${
            error
              ? 'text-rose-600 dark:text-rose-400'
              : isFocused
              ? 'text-blue-600 dark:text-blue-400'
              : isFloated
              ? 'text-slate-700 dark:text-slate-300'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>

        {/* Right Action (e.g. Eye toggle) */}
        {rightElement && (
          <div className="pr-3 flex items-center shrink-0">{rightElement}</div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium pl-1 animate-fadeIn">
          {error}
        </p>
      )}
    </div>
  );
}

// ==============================================================================
// 2. Modern Material-Outlined Floating Label Textarea
// ==============================================================================
export interface ModernFloatingTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  required?: boolean;
}

export function ModernFloatingTextarea({
  label,
  error,
  required,
  value,
  id,
  className = '',
  rows = 4,
  onFocus,
  onBlur,
  placeholder,
  ...props
}: ModernFloatingTextareaProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputId = id || `floating-area-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  const hasValue = value !== undefined && value !== null && String(value).length > 0;
  const isFloated = isFocused || hasValue;

  return (
    <div className="relative w-full group">
      <div
        className={`relative flex bg-white dark:bg-slate-900 border rounded-xl transition-all duration-200 ${
          error
            ? 'border-rose-400 ring-2 ring-rose-500/10 dark:border-rose-500'
            : isFocused
            ? 'border-blue-600 dark:border-blue-500 ring-3 ring-blue-600/15 dark:ring-blue-500/20 shadow-xs'
            : 'border-slate-300 dark:border-slate-700/80 hover:border-slate-400 dark:hover:border-slate-600'
        }`}
      >
        <textarea
          id={inputId}
          rows={rows}
          value={value}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          className={`w-full bg-transparent px-3.5 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none resize-y ${className}`}
          placeholder={isFloated ? (placeholder || '') : ''}
          {...props}
        />

        {/* Floating Label */}
        <label
          htmlFor={inputId}
          className={`absolute pointer-events-none transition-all duration-150 ease-out origin-top-left left-3.5 ${
            isFloated
              ? '-top-2.5 px-1.5 bg-white dark:bg-slate-900 text-[11px] font-semibold leading-none rounded z-10'
              : 'top-3.5 text-sm font-normal text-slate-500 dark:text-slate-400'
          } ${
            error
              ? 'text-rose-600 dark:text-rose-400'
              : isFocused
              ? 'text-blue-600 dark:text-blue-400'
              : isFloated
              ? 'text-slate-700 dark:text-slate-300'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      </div>

      {error && (
        <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium pl-1 animate-fadeIn">
          {error}
        </p>
      )}
    </div>
  );
}

// ==============================================================================
// 3. Modern Material-Outlined Floating Select
// ==============================================================================
export interface ModernFloatingSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  icon?: React.ReactNode;
  error?: string;
  required?: boolean;
  options: { value: string | number; label: string }[];
}

export function ModernFloatingSelect({
  label,
  icon,
  error,
  required,
  value,
  id,
  className = '',
  options,
  ...props
}: ModernFloatingSelectProps) {
  const inputId = id || `floating-select-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

  return (
    <div className="relative w-full group">
      <div
        className={`relative flex items-center bg-white dark:bg-slate-900 border rounded-xl transition-all duration-200 ${
          error
            ? 'border-rose-400 ring-2 ring-rose-500/10 dark:border-rose-500'
            : 'border-slate-300 dark:border-slate-700/80 hover:border-slate-400 dark:hover:border-slate-600 focus-within:border-blue-600 dark:focus-within:border-blue-500 focus-within:ring-3 focus-within:ring-blue-600/15'
        }`}
      >
        {icon && (
          <div className="pl-3.5 pr-1 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            {icon}
          </div>
        )}

        <select
          id={inputId}
          value={value}
          className={`w-full bg-transparent px-3.5 py-3 text-sm text-slate-900 dark:text-white focus:outline-none appearance-none cursor-pointer ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
              {opt.label}
            </option>
          ))}
        </select>

        {/* Floating Label */}
        <label
          htmlFor={inputId}
          className="absolute pointer-events-none -top-2.5 left-3 px-1.5 bg-white dark:bg-slate-900 text-[11px] font-semibold text-slate-700 dark:text-slate-300 leading-none rounded z-10"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>

        {/* Custom Chevron Indicator */}
        <div className="pr-3.5 pointer-events-none text-slate-400 dark:text-slate-500 shrink-0">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {error && (
        <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium pl-1 animate-fadeIn">
          {error}
        </p>
      )}
    </div>
  );
}

// ==============================================================================
// 4. Country Flag Helper
// ==============================================================================
export function CountryFlag({ code, flag, name, className = "w-5 h-3.5" }: { code: string; flag?: string; name?: string; className?: string }) {
  const [imgError, setImgError] = useState(false);
  const cleanCode = (code || '').trim().toLowerCase();

  if (cleanCode && cleanCode.length === 2 && !imgError) {
    return (
      <img
        src={`https://flagcdn.com/w40/${cleanCode}.png`}
        alt={name || code}
        className={`${className} object-cover rounded-xs inline-block shadow-xs shrink-0`}
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

// ==============================================================================
// 5. Advanced Searchable Country Combobox (Matches Screenshot)
// ==============================================================================
export interface ModernCountrySelectProps {
  label: string;
  countries: CountryOption[];
  selectedCode: string;
  onSelect: (country: CountryOption) => void;
  loading?: boolean;
  required?: boolean;
}

export function ModernCountrySelect({
  label,
  countries,
  selectedCode,
  onSelect,
  loading = false,
  required = true,
}: ModernCountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedCountry = useMemo(() => {
    return countries.find((c) => c.code.toLowerCase() === (selectedCode || '').toLowerCase()) || countries[0];
  }, [countries, selectedCode]);

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

        if (aName === q && bName !== q) return -1;
        if (bName === q && aName !== q) return 1;

        const aStarts = aName.startsWith(q);
        const bStarts = bName.startsWith(q);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        return aName.localeCompare(bName);
      });
  }, [countries, searchTerm]);

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

  return (
    <div className="relative w-full" ref={containerRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex items-center justify-between w-full bg-white dark:bg-slate-900 border rounded-xl px-3.5 py-3 cursor-pointer select-none transition-all duration-200 ${
          isOpen
            ? 'border-blue-600 dark:border-blue-500 ring-3 ring-blue-600/15 dark:ring-blue-500/20 shadow-xs'
            : 'border-slate-300 dark:border-slate-700/80 hover:border-slate-400 dark:hover:border-slate-600'
        }`}
      >
        <span className="absolute -top-2.5 left-3 px-1.5 bg-white dark:bg-slate-900 text-[11px] font-semibold text-slate-700 dark:text-slate-300 leading-none rounded z-10">
          {label} {required && <span className="text-rose-500">*</span>}
        </span>

        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          {selectedCountry ? (
            <>
              <CountryFlag code={selectedCountry.code} flag={selectedCountry.flag} name={selectedCountry.name} />
              <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                {selectedCountry.name}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono shrink-0">
                ({selectedCountry.dialCode})
              </span>
            </>
          ) : (
            <span className="text-sm text-slate-400 dark:text-slate-500">Select Country...</span>
          )}
        </div>

        <div className="shrink-0 text-slate-500 dark:text-slate-400">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          ) : isOpen ? (
            <ChevronUp className="w-4 h-4 text-blue-600 dark:text-blue-400 transition-transform" />
          ) : (
            <ChevronDown className="w-4 h-4 transition-transform" />
          )}
        </div>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-fadeIn">
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search country, ISO code or dial code..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/50">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((c, index) => {
                const isSelected = c.code.toLowerCase() === (selectedCountry?.code || '').toLowerCase();
                return (
                  <div
                    key={`${c.code}-${c.name}-${index}`}
                    onClick={() => {
                      onSelect(c);
                      setIsOpen(false);
                    }}
                    className={`flex items-center justify-between px-3.5 py-2.5 text-sm cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-950 dark:text-blue-300 font-medium'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <CountryFlag code={c.code} flag={c.flag} name={c.name} />
                      <span className="truncate">{c.name}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">{c.dialCode}</span>
                      {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
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
// 6. Advanced Searchable State/Province Combobox (Live from MS SQL Server)
// ==============================================================================
export interface ModernStateSelectProps {
  label: string;
  states: (string | GeoItem)[];
  selectedState: string;
  onSelect: (stateName: string, stateObj?: GeoItem) => void;
  loading?: boolean;
  required?: boolean;
  placeholder?: string;
}

export function ModernStateSelect({
  label,
  states,
  selectedState,
  onSelect,
  loading = false,
  required = false,
  placeholder = "Select State / Province...",
}: ModernStateSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const normalizedStates: GeoItem[] = useMemo(() => {
    return states.map((s, idx) => {
      if (typeof s === 'string') {
        return { id: idx + 1, name: s };
      }
      return s;
    });
  }, [states]);

  const hasStatesList = normalizedStates.length > 0;

  const filteredStates = useMemo(() => {
    if (!searchTerm.trim()) return normalizedStates;
    const q = searchTerm.toLowerCase();
    return normalizedStates.filter((s) => s.name.toLowerCase().includes(q) || (s.code && s.code.toLowerCase().includes(q)));
  }, [normalizedStates, searchTerm]);

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
        placeholder="State, Province, or Region"
        required={required}
      />
    );
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      <div
        onClick={() => !loading && setIsOpen(!isOpen)}
        className={`relative flex items-center justify-between w-full bg-white dark:bg-slate-900 border rounded-xl px-3.5 py-3 cursor-pointer select-none transition-all duration-200 ${
          isOpen
            ? 'border-blue-600 dark:border-blue-500 ring-3 ring-blue-600/15 dark:ring-blue-500/20 shadow-xs'
            : 'border-slate-300 dark:border-slate-700/80 hover:border-slate-400 dark:hover:border-slate-600'
        } ${loading ? 'opacity-70 cursor-wait' : ''}`}
      >
        <span className="absolute -top-2.5 left-3 px-1.5 bg-white dark:bg-slate-900 text-[11px] font-semibold text-slate-700 dark:text-slate-300 leading-none rounded z-10">
          {label} {required && <span className="text-rose-500">*</span>}
        </span>

        <div className="flex items-center gap-2 min-w-0 pr-2">
          {loading ? (
            <span className="text-sm text-slate-400 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              Loading regions...
            </span>
          ) : selectedState ? (
            <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
              {selectedState}
            </span>
          ) : (
            <span className="text-sm text-slate-400 dark:text-slate-500">{placeholder}</span>
          )}
        </div>

        <div className="shrink-0 text-slate-500 dark:text-slate-400">
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-fadeIn">
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search state or province..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/50">
            {filteredStates.length > 0 ? (
              filteredStates.map((st) => {
                const isSelected = st.name === selectedState;
                return (
                  <div
                    key={`${st.id}-${st.name}`}
                    onClick={() => {
                      onSelect(st.name, st);
                      setIsOpen(false);
                    }}
                    className={`flex items-center justify-between px-3.5 py-2.5 text-sm cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-950 dark:text-blue-300 font-medium'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <span className="truncate">{st.name}</span>
                    {st.code && <span className="text-xs text-slate-400 dark:text-slate-500 font-mono shrink-0">{st.code}</span>}
                    {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 ml-2" />}
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                No states found matching "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ==============================================================================
// 7. Advanced Searchable City Combobox (Live from MS SQL Server)
// ==============================================================================
export interface ModernCitySelectProps {
  label: string;
  cities: GeoItem[];
  selectedCity: string;
  onSelect: (cityName: string, cityObj?: GeoItem) => void;
  loading?: boolean;
  required?: boolean;
  placeholder?: string;
}

export function ModernCitySelect({
  label,
  cities,
  selectedCity,
  onSelect,
  loading = false,
  required = false,
  placeholder = "Select or search city...",
}: ModernCitySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredCities = useMemo(() => {
    if (!searchTerm.trim()) return cities;
    const q = searchTerm.toLowerCase();
    return cities.filter((c) => c.name.toLowerCase().includes(q));
  }, [cities, searchTerm]);

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

  // If no cities available in dropdown, gracefully render ModernFloatingInput
  if (cities.length === 0 && !loading) {
    return (
      <ModernFloatingInput
        label={label}
        value={selectedCity}
        onChange={(e) => onSelect(e.target.value)}
        placeholder="City name (e.g. New York, London, Peshawar)"
        required={required}
      />
    );
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      <div
        onClick={() => !loading && setIsOpen(!isOpen)}
        className={`relative flex items-center justify-between w-full bg-white dark:bg-slate-900 border rounded-xl px-3.5 py-3 cursor-pointer select-none transition-all duration-200 ${
          isOpen
            ? 'border-blue-600 dark:border-blue-500 ring-3 ring-blue-600/15 dark:ring-blue-500/20 shadow-xs'
            : 'border-slate-300 dark:border-slate-700/80 hover:border-slate-400 dark:hover:border-slate-600'
        } ${loading ? 'opacity-70 cursor-wait' : ''}`}
      >
        <span className="absolute -top-2.5 left-3 px-1.5 bg-white dark:bg-slate-900 text-[11px] font-semibold text-slate-700 dark:text-slate-300 leading-none rounded z-10">
          {label} {required && <span className="text-rose-500">*</span>}
        </span>

        <div className="flex items-center gap-2 min-w-0 pr-2">
          {loading ? (
            <span className="text-sm text-slate-400 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              Loading cities...
            </span>
          ) : selectedCity ? (
            <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
              {selectedCity}
            </span>
          ) : (
            <span className="text-sm text-slate-400 dark:text-slate-500">{placeholder}</span>
          )}
        </div>

        <div className="shrink-0 text-slate-500 dark:text-slate-400">
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-fadeIn">
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search city..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/50">
            {filteredCities.length > 0 ? (
              filteredCities.map((ct) => {
                const isSelected = ct.name === selectedCity;
                return (
                  <div
                    key={`${ct.id}-${ct.name}`}
                    onClick={() => {
                      onSelect(ct.name, ct);
                      setIsOpen(false);
                    }}
                    className={`flex items-center justify-between px-3.5 py-2.5 text-sm cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-950 dark:text-blue-300 font-medium'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <span className="truncate">{ct.name}</span>
                    {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 ml-2" />}
                  </div>
                );
              })
            ) : (
              <div className="p-3 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">No predefined cities matching "{searchTerm}"</p>
                {searchTerm.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(searchTerm.trim());
                      setIsOpen(false);
                    }}
                    className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                  >
                    Use custom city "{searchTerm.trim()}"
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
