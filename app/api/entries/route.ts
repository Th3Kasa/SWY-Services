import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { getServiceById } from '@/lib/services';
import { COOKIE_NAME, getAuthUserFromCookie } from '@/lib/auth';

// GET /api/entries?serviceId=monthly-outings
// Returns entries for a service (or all entries if no serviceId param)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const serviceId = searchParams.get('serviceId');

  try {
    const supabase = getSupabaseServer();
    let query = supabase
      .from('service_entries')
      .select('*')
      .order('date', { ascending: true });

    if (serviceId) {
      query = query.eq('service_id', serviceId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ entries: data ?? [] });
  } catch (err) {
    console.error('GET /api/entries error:', err);
    return NextResponse.json({ error: 'Failed to fetch entries.' }, { status: 500 });
  }
}

// POST /api/entries — create a new service entry
export async function POST(req: NextRequest) {
  // Auth check
  const cookieRaw = req.cookies.get(COOKIE_NAME)?.value;
  const currentUser = getAuthUserFromCookie(cookieRaw);
  if (!currentUser) {
    return NextResponse.json({ error: 'Not authenticated. Please sign in.' }, { status: 401 });
  }

  // Parse body
  let body: { serviceId?: string; date?: string; team?: string; what?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { serviceId, date, team, what } = body;

  // Validate
  if (!serviceId || !getServiceById(serviceId)) {
    return NextResponse.json({ error: 'Invalid service ID.' }, { status: 400 });
  }
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Date is required (YYYY-MM-DD format).' }, { status: 400 });
  }
  if (!team?.trim()) {
    return NextResponse.json({ error: 'Team / who field is required.' }, { status: 400 });
  }
  if (!what?.trim()) {
    return NextResponse.json({ error: 'Activity description (what) is required.' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServer();

    // Check for duplicate: same service + same date
    const { data: existing } = await supabase
      .from('service_entries')
      .select('id, team')
      .eq('service_id', serviceId)
      .eq('date', date)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: `An entry for this service on that date already exists (submitted by: ${existing.team}). Please choose a different date.` },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('service_entries')
      .insert({
        service_id: serviceId,
        date,
        team: team.trim(),
        what: what.trim(),
        created_by_email: currentUser.email,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ entry: data }, { status: 201 });
  } catch (err) {
    console.error('POST /api/entries error:', err);
    return NextResponse.json({ error: 'Failed to save entry. Please try again.' }, { status: 500 });
  }
}
