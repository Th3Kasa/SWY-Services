// Centralised input sanitisation helpers used across all API routes.

const MAX_NAME    = 100;
const MAX_EMAIL   = 254;  // RFC 5321 limit
const MAX_TEXT    = 1000; // team / what fields
const MAX_TOKEN   = 128;  // invite / captcha tokens

// Strip ASCII control characters (keep tab, newline, carriage return for text fields).
function stripControl(s: string): string {
  return s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/** Trim, strip control chars, cap length. Returns '' for non-strings. */
export function sanitizeString(s: unknown, maxLen = MAX_TEXT): string {
  if (typeof s !== 'string') return '';
  return stripControl(s.trim()).slice(0, maxLen);
}

/** Name fields: same as sanitizeString but with tighter length cap. */
export function sanitizeName(s: unknown): string {
  return sanitizeString(s, MAX_NAME);
}

/** Email: lowercase, trim, strip control chars, cap at 254 chars. */
export function sanitizeEmail(s: unknown): string {
  if (typeof s !== 'string') return '';
  return stripControl(s.trim().toLowerCase()).slice(0, MAX_EMAIL);
}

/** PIN: keep digits only, cap at 8 chars. */
export function sanitizePin(s: unknown): string {
  if (typeof s !== 'string') return '';
  return s.replace(/\D/g, '').slice(0, 8);
}

/** Invite / captcha tokens: only alphanumeric + dashes, cap length. */
export function sanitizeToken(s: unknown): string {
  if (typeof s !== 'string') return '';
  return s.replace(/[^a-zA-Z0-9\-_]/g, '').slice(0, MAX_TOKEN);
}

/**
 * Date string: must be YYYY-MM-DD and represent a real calendar date.
 * Returns '' if invalid.
 */
export function sanitizeDate(s: unknown): string {
  if (typeof s !== 'string') return '';
  const trimmed = s.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return '';
  const d = new Date(trimmed + 'T00:00:00');
  if (isNaN(d.getTime())) return '';
  // Confirm the parsed values match (catches Feb 30 etc.)
  const [y, m, day] = trimmed.split('-').map(Number);
  if (d.getFullYear() !== y || d.getMonth() + 1 !== m || d.getDate() !== day) return '';
  return trimmed;
}

/**
 * UUID (v4) path params: validates format, returns '' if invalid.
 * Prevents path-traversal / injection in DB queries using `.eq('id', params.id)`.
 */
export function sanitizeUuid(s: string): string {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)) return '';
  return s.toLowerCase();
}
