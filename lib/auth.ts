import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'crypto';

const COOKIE_NAME = 'swy_user';

export type AuthUser = {
  name: string;
  email: string;
  isAdmin?: boolean;
};

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error('SESSION_SECRET env var is not set');
  return s;
}

function sign(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('hex');
}

// Serialize and sign the cookie value
export function serializeAuthCookie(user: AuthUser): string {
  const payload = JSON.stringify(user);
  const sig = sign(payload);
  // Format: base64(payload).signature
  return `${Buffer.from(payload).toString('base64url')}.${sig}`;
}

// Verify signature and parse cookie value
function parseAuthCookie(raw: string): AuthUser | null {
  try {
    const dot = raw.lastIndexOf('.');
    if (dot === -1) return null;
    const encodedPayload = raw.slice(0, dot);
    const sig = raw.slice(dot + 1);
    const payload = Buffer.from(encodedPayload, 'base64url').toString('utf8');
    const expected = sign(payload);
    // Constant-time comparison to prevent timing attacks
    if (!timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))) return null;
    const parsed = JSON.parse(payload) as AuthUser;
    if (!parsed.name || !parsed.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

// Read the auth cookie from Next.js server context
export function getAuthUser(): AuthUser | null {
  try {
    const cookieStore = cookies();
    const raw = cookieStore.get(COOKIE_NAME)?.value;
    if (!raw) return null;
    return parseAuthCookie(raw);
  } catch {
    return null;
  }
}

// Read auth cookie from a NextRequest (for API routes)
export function getAuthUserFromCookie(raw: string | undefined): AuthUser | null {
  if (!raw) return null;
  return parseAuthCookie(raw);
}

export { COOKIE_NAME };
