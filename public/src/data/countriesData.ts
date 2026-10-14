// World Country Data & Flag Helper
export interface CountryInfo {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
  phoneFormat?: string;
}

export const COUNTRIES_DATA: CountryInfo[] = [
  { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', dialCode: '+49' },
  { code: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰', dialCode: '+92' },
  { code: 'IN', name: 'India', flag: '🇮🇳', dialCode: '+91' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', dialCode: '+971' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', dialCode: '+966' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', dialCode: '+61' },
];

export function getCountryByCode(code: string): CountryInfo {
  const found = COUNTRIES_DATA.find((c) => c.code.toUpperCase() === (code || '').toUpperCase());
  return found || COUNTRIES_DATA[0];
}
