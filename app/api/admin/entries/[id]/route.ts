import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { COOKIE_NAME, getAuthUserFromCookie } from '@/lib/auth';
import { getServiceById } from '@/lib/services';
import { sanitizeUuid, sanitizeString, sanitizeDate } from '@/lib/sanitize';

function isAdmin(req: NextRequest): boolean {
  const raw = req.cookies.get(COOKIE_NAME)?.value;
  return getAuthUserFromCookie(raw)?.isAdmin === true;
}

// PATCH /api/admin/entries/[id] — edit an entry
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const id = sanitizeUuid(params.id);
  if (!id) return NextResponse.json({ error: 'Invalid entry ID.' }, { status: 400 });

  let body: { service_id?: string; date?: string; team?: string; what?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const updates: Record<string, string> = {};

  if (body.service_id !== undefined) {
    if (!getServiceById(body.service_id)) {
      return NextResponse.json({ error: 'Invalid service ID.' }, { status: 400 });
    }
    updates.service_id = body.service_id;
  }
  if (body.date !== undefined) {
    const date = sanitizeDate(body.date);
    if (!date) return NextResponse.json({ error: 'Date must be a valid YYYY-MM-DD.' }, { status: 400 });
    updates.date = date;
  }
  if (body.team !== undefined) {
    const team = sanitizeString(body.team);
    if (!team) return NextResponse.json({ error: 'Team cannot be empty.' }, { status: 400 });
    updates.team = team;
  }
  if (body.what !== undefined) {
    const what = sanitizeString(body.what);
    if (!what) return NextResponse.json({ error: 'Activity cannot be empty.' }, { status: 400 });
    updates.what = what;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update.' }, { status: 400 });
  }

  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from('service_entries')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Failed to update entry.' }, { status: 500 });
  return NextResponse.json({ entry: data });
}

// DELETE /api/admin/entries/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const id = sanitizeUuid(params.id);
  if (!id) return NextResponse.json({ error: 'Invalid entry ID.' }, { status: 400 });

  const supabase = getSupabaseServer();
  const { error } = await supabase.from('service_entries').delete().eq('id', id);

  if (error) return NextResponse.json({ error: 'Failed to delete entry.' }, { status: 500 });
  return NextResponse.json({ success: true });
}
