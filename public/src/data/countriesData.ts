// Comprehensive world country, state/province, and international telephone dataset
// Powered by country-state-city standard ISO database covering all 250 sovereign nations & territories

import { Country, State } from 'country-state-city';

export interface CountryInfo {
  code: string;        // ISO 3166-1 alpha-2 (e.g. US, GB, PK, CA)
  name: string;        // Official common country name
  flag: string;        // Emoji flag
  dialCode: string;    // ITU dial code (e.g. +1, +44, +92)
  phoneFormat?: string;// Formatting placeholder (e.g. (###) ###-####)
  states?: string[];   // Pre-cached or dynamically retrieved states/provinces
}

// Top frequently chosen countries for fast one-click access
const TOP_COUNTRY_CODES = ['US', 'GB', 'PK', 'IN', 'CA', 'AU', 'DE', 'FR', 'AE', 'SA'];

// Custom format overrides for the most common telephone dial patterns
const PHONE_FORMAT_MAP: Record<string, string> = {
  '+1': '(###) ###-####',
  '+44': '#### ######',
  '+92': '### #######',
  '+91': '##### #####',
  '+61': '#### ### ###',
  '+49': '#### #######',
  '+33': '# ## ## ## ##',
  '+971': '## ### ####',
  '+966': '## ### ####',
};

// Retrieve all countries formatted cleanly
const rawCountries = Country.getAllCountries();

export const COUNTRIES_DATA: CountryInfo[] = rawCountries
  .map((c) => {
    const rawDial = c.phonecode ? c.phonecode.replace(/[^0-9]/g, '') : '';
    const dialCode = rawDial ? `+${rawDial}` : '+1';
    return {
      code: c.isoCode,
      name: c.name,
      flag: c.flag || '🌐',
      dialCode,
      phoneFormat: PHONE_FORMAT_MAP[dialCode] || '### ### ####',
    };
  })
  .sort((a, b) => {
    const aTopIndex = TOP_COUNTRY_CODES.indexOf(a.code);
    const bTopIndex = TOP_COUNTRY_CODES.indexOf(b.code);

    if (aTopIndex !== -1 && bTopIndex !== -1) return aTopIndex - bTopIndex;
    if (aTopIndex !== -1) return -1;
    if (bTopIndex !== -1) return 1;

    return a.name.localeCompare(b.name);
  });

// Helper to look up country by ISO code
export function getCountryByCode(code: string): CountryInfo {
  if (!code) return COUNTRIES_DATA[0];
  const found = COUNTRIES_DATA.find((c) => c.code.toUpperCase() === code.toUpperCase());
  return found || COUNTRIES_DATA[0];
}

// Helper to look up country by Dial Code
export function getCountryByDialCode(dialCode: string): CountryInfo {
  if (!dialCode) return COUNTRIES_DATA[0];
  const clean = dialCode.startsWith('+') ? dialCode : `+${dialCode}`;
  const found = COUNTRIES_DATA.find((c) => c.dialCode === clean);
  return found || COUNTRIES_DATA[0];
}

// Dynamic state/province/territory retriever covering all world countries
export function getStatesForCountry(countryCode: string): string[] {
  if (!countryCode) return [];
  try {
    const states = State.getStatesOfCountry(countryCode);
    if (!states || states.length === 0) return [];
    return states.map((s) => s.name).filter(Boolean).sort((a, b) => a.localeCompare(b));
  } catch (err) {
    console.warn(`[getStatesForCountry] Failed to load states for ${countryCode}:`, err);
    return [];
  }
}

// Phone Number Sanitizer and Real-time Masking Formatter
export function formatPhoneNumber(dialCode: string, rawInput: string): string {
  // Strip non-numeric characters
  const digits = rawInput.replace(/\D/g, '').slice(0, 15);
  const country = getCountryByDialCode(dialCode);
  const pattern = country.phoneFormat || '### ### ####';

  if (!pattern || digits.length === 0) return digits;

  let formatted = '';
  let digitIndex = 0;

  for (let i = 0; i < pattern.length && digitIndex < digits.length; i++) {
    if (pattern[i] === '#') {
      formatted += digits[digitIndex];
      digitIndex++;
    } else {
      formatted += pattern[i];
    }
  }

  // Append any excess digits if user enters more than placeholder pattern
  if (digitIndex < digits.length) {
    formatted += ' ' + digits.slice(digitIndex);
  }

  return formatted;
}

// Validate Phone Number length (Standard E.164: 7 to 15 digits)
export function isValidPhoneNumber(rawPhone: string): boolean {
  const digits = rawPhone.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}
