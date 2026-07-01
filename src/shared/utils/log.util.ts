/**
 * Logging helpers. Critically: scrubs sensitive values (raw phone numbers,
 * access tokens, encryption material) so they are never written to logs.
 */
const SENSITIVE_KEYS = [
  'phone',
  'rawphone',
  'accesstoken',
  'access_token',
  'token',
  'password',
  'secret',
  'encryptionkey',
  'hashsecret',
  'authorization',
];

export class LogUtil {
  /** Returns a shallow copy with sensitive fields redacted. */
  static redact(obj: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      out[key] = SENSITIVE_KEYS.includes(key.toLowerCase().replace(/[^a-z_]/g, ''))
        ? '[REDACTED]'
        : value;
    }
    return out;
  }

  /** Safe JSON stringify with redaction. */
  static safeStringify(obj: Record<string, unknown>): string {
    return JSON.stringify(LogUtil.redact(obj));
  }
}
