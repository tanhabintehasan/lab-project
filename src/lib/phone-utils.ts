/**
 * Phone number normalization utilities.
 * All phone numbers are stored and queried in E.164 format:
 *   +<country_code><national_number>
 *
 * Examples:
 *   China:    +8613800138000
 *   US:       +14155552671
 *   UK:       +447700900123
 */

export interface CountryCode {
  code: string;
  label: string;
  flag: string;
}

export const SUPPORTED_COUNTRIES: CountryCode[] = [
  { code: '+86', label: 'China (+86)', flag: 'CN' },
  { code: '+1', label: 'USA/Canada (+1)', flag: 'US' },
  { code: '+44', label: 'UK (+44)', flag: 'GB' },
  { code: '+61', label: 'Australia (+61)', flag: 'AU' },
  { code: '+81', label: 'Japan (+81)', flag: 'JP' },
  { code: '+82', label: 'South Korea (+82)', flag: 'KR' },
  { code: '+65', label: 'Singapore (+65)', flag: 'SG' },
  { code: '+852', label: 'Hong Kong (+852)', flag: 'HK' },
  { code: '+886', label: 'Taiwan (+886)', flag: 'TW' },
  { code: '+49', label: 'Germany (+49)', flag: 'DE' },
  { code: '+33', label: 'France (+33)', flag: 'FR' },
  { code: '+7', label: 'Russia (+7)', flag: 'RU' },
  { code: '+91', label: 'India (+91)', flag: 'IN' },
  { code: '+62', label: 'Indonesia (+62)', flag: 'ID' },
  { code: '+60', label: 'Malaysia (+60)', flag: 'MY' },
  { code: '+66', label: 'Thailand (+66)', flag: 'TH' },
  { code: '+84', label: 'Vietnam (+84)', flag: 'VN' },
  { code: '+63', label: 'Philippines (+63)', flag: 'PH' },
];

const DEFAULT_COUNTRY = '+86';

/**
 * Extract digits only from a phone string.
 */
function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Normalize a phone number to E.164 format.
 *
 * @param phone Raw phone input (may include country code, spaces, dashes)
 * @param countryCode e.g. '+86' — used if the input doesn't start with '+'
 * @returns E.164 string like '+8613800138000' or empty string if invalid
 */
export function normalizePhone(phone: string, countryCode: string = DEFAULT_COUNTRY): string {
  const trimmed = phone.trim();
  if (!trimmed) return '';

  // Already starts with + — keep as-is after cleaning
  if (trimmed.startsWith('+')) {
    const digits = digitsOnly(trimmed);
    return digits ? `+${digits}` : '';
  }

  // Starts with country code digits without +
  const ccDigits = digitsOnly(countryCode);
  const allDigits = digitsOnly(trimmed);

  if (allDigits.startsWith(ccDigits)) {
    return `+${allDigits}`;
  }

  // Prepend country code
  return `+${ccDigits}${allDigits}`;
}

/**
 * Validate a phone number for a specific country.
 * Returns true if the number looks valid (basic length checks).
 */
export function isValidPhone(phone: string, countryCode: string = DEFAULT_COUNTRY): boolean {
  const normalized = normalizePhone(phone, countryCode);
  if (!normalized) return false;

  const digits = digitsOnly(normalized);
  const ccDigits = digitsOnly(countryCode);
  const national = digits.slice(ccDigits.length);

  // Minimum national number length: 4 digits
  // Maximum total length: 15 digits per E.164
  return national.length >= 4 && digits.length <= 15;
}

/**
 * Format a phone number for display.
 * Example: +8613800138000 -> +86 138 0013 8000
 */
export function formatPhoneDisplay(phone: string): string {
  const normalized = normalizePhone(phone);
  if (!normalized) return phone;

  // China format
  if (normalized.startsWith('+86') && normalized.length === 14) {
    return `${normalized.slice(0, 3)} ${normalized.slice(3, 6)} ${normalized.slice(6, 10)} ${normalized.slice(10)}`;
  }

  return normalized;
}

/**
 * Server-side phone normalization.
 * Same as normalizePhone but with stricter validation.
 * Returns null if the phone is clearly invalid.
 */
export function normalizePhoneStrict(phone: string, countryCode: string = DEFAULT_COUNTRY): string | null {
  const normalized = normalizePhone(phone, countryCode);
  if (!normalized) return null;

  const digits = digitsOnly(normalized);
  if (digits.length < 7 || digits.length > 15) return null;

  return normalized;
}
