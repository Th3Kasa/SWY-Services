import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { COOKIE_NAME, getAuthUserFromCookie, AuthUser } from '@/lib/auth';

const ADMIN_EMAIL = 'basemmorkos98@gmail.com';

function getAdminUser(req: NextRequest): AuthUser | null {
  const raw = req.cookies.get(COOKIE_NAME)?.value;
  const user = getAuthUserFromCookie(raw);
  if (!user || user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) return null;
  return user;
}

// PATCH /api/admin/users/[id] — edit user name and/or email
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!getAdminUser(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: { full_name?: string; email?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }

  const updates: Record<string, string> = {};
  if (body.full_name?.trim()) updates.full_name = body.full_name.trim();
  if (body.email?.trim()) updates.email = body.email.trim().toLowerCase();

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
  }

  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'That email is already in use.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update user.' }, { status: 500 });
  }

  return NextResponse.json({ user: data });
}

// DELETE /api/admin/users/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!getAdminUser(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = getSupabaseServer();
  const { error } = await supabase.from('users').delete().eq('id', params.id);

  if (error) return NextResponse.json({ error: 'Failed to delete user.' }, { status: 500 });
  return NextResponse.json({ success: true });
}
