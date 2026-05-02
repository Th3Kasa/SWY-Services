import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { COOKIE_NAME, AuthUser } from '@/lib/auth';

const ADMIN_EMAIL = 'basemmorkos98@gmail.com';

function getAdminUser(req: NextRequest): AuthUser | null {
  try {
    const raw = req.cookies.get(COOKIE_NAME)?.value;
    if (!raw) return null;
    const user = JSON.parse(raw) as AuthUser;
    if (user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) return null;
    return user;
  } catch {
    return null;
  }
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
