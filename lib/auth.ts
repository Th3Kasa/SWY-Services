import { cookies } from 'next/headers';

const COOKIE_NAME = 'swy_user';

export type AuthUser = {
  name: string;
  email: string;
};

// Read the auth cookie from Next.js server context
export function getAuthUser(): AuthUser | null {
  try {
    const cookieStore = cookies();
    const raw = cookieStore.get(COOKIE_NAME)?.value;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    if (!parsed.name || !parsed.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

// Serialize the cookie value (used in API routes via NextResponse)
export function serializeAuthCookie(user: AuthUser): string {
  return JSON.stringify(user);
}

export { COOKIE_NAME };
