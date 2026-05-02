import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { COOKIE_NAME, getAuthUserFromCookie } from '@/lib/auth';
import { getServiceById } from '@/lib/services';

function isAdmin(req: NextRequest): boolean {
  const raw = req.cookies.get(COOKIE_NAME)?.value;
  return getAuthUserFromCookie(raw)?.isAdmin === true;
}

// PATCH /api/admin/entries/[id] — edit an entry
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

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
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
      return NextResponse.json({ error: 'Date must be YYYY-MM-DD.' }, { status: 400 });
    }
    updates.date = body.date;
  }
  if (body.team !== undefined) {
    if (!body.team.trim()) return NextResponse.json({ error: 'Team cannot be empty.' }, { status: 400 });
    updates.team = body.team.trim();
  }
  if (body.what !== undefined) {
    if (!body.what.trim()) return NextResponse.json({ error: 'Activity cannot be empty.' }, { status: 400 });
    updates.what = body.what.trim();
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update.' }, { status: 400 });
  }

  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from('service_entries')
    .update(updates)
    .eq('id', params.id)
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

  const supabase = getSupabaseServer();
  const { error } = await supabase.from('service_entries').delete().eq('id', params.id);

  if (error) return NextResponse.json({ error: 'Failed to delete entry.' }, { status: 500 });
  return NextResponse.json({ success: true });
}
