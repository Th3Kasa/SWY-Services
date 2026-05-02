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

    // Verify reCAPTCHA token
    const captchaToken = (body.captchaToken as string)?.trim();
    if (!captchaToken) {
      return NextResponse.json({ error: 'Please complete the reCAPTCHA.' }, { status: 400 });
    }
    const captchaRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`,
    });
    const captchaData = await captchaRes.json();
    if (!captchaData.success) {
      return NextResponse.json({ error: 'reCAPTCHA verification failed. Please try again.' }, { status: 400 });
    }

    const supabase = getSupabaseServer();

    // Fetch existing user record (name + admin status + pin)
    const { data: existing } = await supabase
      .from('users')
      .select('full_name, is_admin, pin_hash')
      .eq('email', email)
      .maybeSingle();

    if (existing && existing.full_name.toLowerCase() !== name.toLowerCase()) {
      return NextResponse.json(
        { error: 'Wrong information. Please check your name and email and try again.' },
        { status: 409 }
      );
    }

    // Determine if this user is an admin
    const isDbAdmin = existing?.is_admin === true;
    const isAdminUser = email === ADMIN_EMAIL || isDbAdmin;

    // PIN check for any admin
    if (isAdminUser) {
      const pin = (body.pin as string)?.trim();
      if (!pin) {
        return NextResponse.json({ error: 'Incorrect PIN. Please try again.' }, { status: 403 });
      }

      if (email === ADMIN_EMAIL) {
        // Hardcoded super-admin — check admin_settings table first, then env fallback
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
          valid = pin === process.env.ADMIN_PIN;
        }
        if (!valid) {
          return NextResponse.json({ error: 'Incorrect PIN. Please try again.' }, { status: 403 });
        }
      } else {
        // DB admin — verify against their per-user pin_hash
        if (!existing?.pin_hash) {
          return NextResponse.json({ error: 'Admin PIN not set up yet. Check your email for the setup link.' }, { status: 403 });
        }
        if (!verifyPin(pin, existing.pin_hash)) {
          return NextResponse.json({ error: 'Incorrect PIN. Please try again.' }, { status: 403 });
        }
      }
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

    // Set cookie (include isAdmin so the admin layout gate works without a DB call)
    const cookieValue = serializeAuthCookie({ name, email, ...(isAdminUser && { isAdmin: true }) });
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
