import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { COOKIE_NAME, serializeAuthCookie } from '@/lib/auth';
import { verifyPin } from '@/lib/pin';

const ADMIN_EMAIL = 'basemmorkos98@gmail.com';

function toTitleCase(str: string): string {
  return str.trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = toTitleCase((body.name as string) ?? '');
    const email = (body.email as string)?.trim().toLowerCase();

    // Validate
    if (!name) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
    }

    // Admin PIN check — only for the admin account
    if (email === ADMIN_EMAIL) {
      const pin = (body.pin as string)?.trim();
      if (!pin) {
        return NextResponse.json({ error: 'Incorrect PIN. Please try again.' }, { status: 403 });
      }
      const supabaseForPin = getSupabaseServer();
      const { data: settings } = await supabaseForPin
        .from('admin_settings')
        .select('pin_hash')
        .eq('id', 'singleton')
        .maybeSingle();

      let valid = false;
      if (settings?.pin_hash) {
        valid = verifyPin(pin, settings.pin_hash);
      } else {
        // Fallback to env var (plain comparison) before any PIN has been set via the app
        valid = pin === process.env.ADMIN_PIN;
      }
      if (!valid) {
        return NextResponse.json({ error: 'Incorrect PIN. Please try again.' }, { status: 403 });
      }
    }

    const supabase = getSupabaseServer();

    // Check if email is already registered to a different name
    const { data: existing } = await supabase
      .from('users')
      .select('full_name')
      .eq('email', email)
      .maybeSingle();

    if (existing && existing.full_name.toLowerCase() !== name.toLowerCase()) {
      return NextResponse.json(
        { error: 'Wrong information. Please check your name and email and try again.' },
        { status: 409 }
      );
    }

    // Upsert user into DB (safe — same email+name = returning user)
    const { error } = await supabase.from('users').upsert(
      { full_name: name, email },
      { onConflict: 'email', ignoreDuplicates: false }
    );

    if (error) {
      console.error('Supabase upsert error:', error);
      return NextResponse.json({ error: 'Database error. Please try again.' }, { status: 500 });
    }

    // Set cookie
    const cookieValue = serializeAuthCookie({ name, email });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(COOKIE_NAME, cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
