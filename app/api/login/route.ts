import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { COOKIE_NAME, serializeAuthCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = (body.name as string)?.trim();
    const email = (body.email as string)?.trim().toLowerCase();

    // Validate
    if (!name) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
    }

    // Upsert user into DB
    const supabase = getSupabaseServer();
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
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
