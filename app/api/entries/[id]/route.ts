import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { COOKIE_NAME, getAuthUserFromCookie, AuthUser } from '@/lib/auth';
import { sanitizeUuid, sanitizeString, sanitizeDate } from '@/lib/sanitize';

function getUser(req: NextRequest): AuthUser | null {
  const raw = req.cookies.get(COOKIE_NAME)?.value;
  return getAuthUserFromCookie(raw);
}

// PATCH /api/entries/[id] — edit team + what (submitter only)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const id = sanitizeUuid(params.id);
  if (!id) return NextResponse.json({ error: 'Invalid entry ID.' }, { status: 400 });

  let body: { date?: string; team?: string; what?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }

  const date = body.date !== undefined ? sanitizeDate(body.date) : undefined;
  const team = body.team !== undefined ? sanitizeString(body.team) : undefined;
  const what = body.what !== undefined ? sanitizeString(body.what) : undefined;

  if (body.date !== undefined && !date) {
    return NextResponse.json({ error: 'Invalid date format.' }, { status: 400 });
  }
  if (!date && !team && !what) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
  }

  const supabase = getSupabaseServer();

  // Confirm the entry belongs to this user
  const { data: entry } = await supabase
    .from('service_entries')
    .select('id, created_by_email')
    .eq('id', id)
    .maybeSingle();

  if (!entry) return NextResponse.json({ error: 'Entry not found.' }, { status: 404 });
  if (entry.created_by_email !== user.email) {
    return NextResponse.json({ error: 'You can only edit your own entries.' }, { status: 403 });
  }

  const updates: Record<string, string> = {};
  if (date) updates.date = date;
  if (team) updates.team = team;
  if (what) updates.what = what;

  const { data: updated, error } = await supabase
    .from('service_entries')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('PATCH /api/entries/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update entry.' }, { status: 500 });
  }

  return NextResponse.json({ entry: updated });
}

// DELETE /api/entries/[id] — delete (submitter only)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const id = sanitizeUuid(params.id);
  if (!id) return NextResponse.json({ error: 'Invalid entry ID.' }, { status: 400 });

  const supabase = getSupabaseServer();

  const { data: entry } = await supabase
    .from('service_entries')
    .select('id, created_by_email')
    .eq('id', id)
    .maybeSingle();

  if (!entry) return NextResponse.json({ error: 'Entry not found.' }, { status: 404 });
  if (entry.created_by_email !== user.email) {
    return NextResponse.json({ error: 'You can only delete your own entries.' }, { status: 403 });
  }

  const { error } = await supabase.from('service_entries').delete().eq('id', id);
  if (error) {
    console.error('DELETE /api/entries/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete entry.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
