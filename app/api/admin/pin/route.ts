import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { COOKIE_NAME, getAuthUserFromCookie } from '@/lib/auth';
import { verifyPin, makeStoredPin } from '@/lib/pin';

const ADMIN_EMAIL = 'basemmorkos98@gmail.com';

// PATCH /api/admin/pin — change the admin PIN
export async function PATCH(req: NextRequest) {
  const raw = req.cookies.get(COOKIE_NAME)?.value;
  const user = getAuthUserFromCookie(raw);
  if (!user || user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: { currentPin?: string; newPin?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }

  const { currentPin, newPin } = body;
  if (!currentPin || !newPin) {
    return NextResponse.json({ error: 'Both current and new PIN are required.' }, { status: 400 });
  }
  if (newPin.length < 4) {
    return NextResponse.json({ error: 'New PIN must be at least 4 digits.' }, { status: 400 });
  }

  const supabase = getSupabaseServer();

  const { data: settings } = await supabase
    .from('admin_settings')
    .select('pin_hash')
    .eq('id', 'singleton')
    .maybeSingle();

  let currentPinValid = false;
  if (settings?.pin_hash) {
    currentPinValid = verifyPin(currentPin, settings.pin_hash);
  } else {
    // Fallback: compare plain against ADMIN_PIN env var
    currentPinValid = currentPin === process.env.ADMIN_PIN;
  }

  if (!currentPinValid) {
    return NextResponse.json({ error: 'Current PIN is incorrect.' }, { status: 403 });
  }

  const newHash = makeStoredPin(newPin);
  const { error } = await supabase
    .from('admin_settings')
    .upsert({ id: 'singleton', pin_hash: newHash, updated_at: new Date().toISOString() });

  if (error) {
    return NextResponse.json({ error: 'Failed to update PIN.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
