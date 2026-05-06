import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { makeStoredPin } from '@/lib/pin';
import { sanitizeToken, sanitizePin } from '@/lib/sanitize';

// GET /api/setup-admin-pin?token=xxx — verify token is valid (for page load check)
export async function GET(req: NextRequest) {
  const token = sanitizeToken(req.nextUrl.searchParams.get('token'));
  if (!token) return NextResponse.json({ valid: false });

  const supabase = getSupabaseServer();
  const { data } = await supabase
    .from('users')
    .select('id, full_name')
    .eq('admin_invite_token', token)
    .gt('admin_invite_token_expires_at', new Date().toISOString())
    .maybeSingle();

  if (!data) return NextResponse.json({ valid: false });
  return NextResponse.json({ valid: true, name: data.full_name });
}

// POST /api/setup-admin-pin — consume token and save hashed PIN
export async function POST(req: NextRequest) {
  let body: { token?: string; pin?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }

  const token = sanitizeToken(body.token);
  const pin   = sanitizePin(body.pin);

  if (!token || !pin) return NextResponse.json({ error: 'Token and PIN are required.' }, { status: 400 });
  if (!/^\d{4}$/.test(pin)) return NextResponse.json({ error: 'PIN must be exactly 4 digits.' }, { status: 400 });

  const supabase = getSupabaseServer();

  // Verify token is still valid
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('admin_invite_token', token)
    .gt('admin_invite_token_expires_at', new Date().toISOString())
    .maybeSingle();

  if (!user) return NextResponse.json({ error: 'This link has expired or is invalid.' }, { status: 400 });

  // Hash PIN and clear the invite token
  const pin_hash = makeStoredPin(pin);
  const { error } = await supabase
    .from('users')
    .update({ pin_hash, admin_invite_token: null, admin_invite_token_expires_at: null })
    .eq('id', user.id);

  if (error) return NextResponse.json({ error: 'Failed to save PIN. Please try again.' }, { status: 500 });

  return NextResponse.json({ success: true });
}
