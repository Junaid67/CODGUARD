/**
 * Pakistani phone number normalization (§8.1).
 * ALWAYS run normalize → validate before hashing/encrypting/storing.
 * If normalizePhone returns null, the order must be skipped (and logged).
 */

export function normalizePhone(raw: string): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, ''); // strip all non-digits

  // Local format with leading zero: 03XXXXXXXXX (11 digits)
  if (digits.startsWith('0') && digits.length === 11) {
    digits = '92' + digits.slice(1);
  }
  // Missing country code: 3XXXXXXXXX (10 digits)
  if (digits.length === 10 && !digits.startsWith('92')) {
    digits = '92' + digits;
  }
  // Already has country code: 92XXXXXXXXXX (12 digits)
  if (digits.startsWith('92') && digits.length === 12) {
    return '+' + digits;
  }

  return null; // invalid — don't process
}

export function isValidPakistaniPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  if (!normalized) return false;
  // Pakistani mobile: +92 3XX XXXXXXX
  return /^\+923[0-9]{9}$/.test(normalized);
}

/**
 * Masks a normalized phone for display, showing only the last 4 digits.
 * e.g. +923001234567 → +92-300-XXX4567. Never returns the raw number.
 */
export function maskPhone(normalized: string | null): string | null {
  if (!normalized) return null;
  const digits = normalized.replace(/\D/g, '');
  if (digits.length < 4) return 'XXXX';
  const last4 = digits.slice(-4);
  return `+${digits.slice(0, 2)}-${digits.slice(2, 5)}-XXX${last4}`;
}
