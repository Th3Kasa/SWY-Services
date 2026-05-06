import { NextRequest, NextResponse } from 'next/server';
import { authLimiter, adminActionLimiter, apiLimiter } from '@/lib/ratelimit';

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip cron — authenticated via CRON_SECRET header, not user-facing
  if (pathname.startsWith('/api/cron/')) return NextResponse.next();

  const ip = getIp(req);

  let limiter: typeof authLimiter = null;

  if (
    pathname === '/api/login' ||
    pathname === '/api/setup-admin-pin' ||
    pathname === '/api/admin/pin'
  ) {
    limiter = authLimiter;
  } else if (
    pathname === '/api/admin/test-email' ||
    pathname === '/api/admin/test-reminder'
  ) {
    limiter = adminActionLimiter;
  } else if (pathname.startsWith('/api/')) {
    limiter = apiLimiter;
  }

  if (limiter) {
    const { success, limit, remaining, reset } = await limiter.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down and try again shortly.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(reset),
            'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
          },
        }
      );
    }
    const res = NextResponse.next();
    res.headers.set('X-RateLimit-Limit', String(limit));
    res.headers.set('X-RateLimit-Remaining', String(remaining));
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
