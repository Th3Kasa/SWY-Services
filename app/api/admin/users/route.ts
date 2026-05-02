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

// GET /api/admin/users — list all users
export async function GET(req: NextRequest) {
  if (!getAdminUser(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Failed to fetch users.' }, { status: 500 });
  return NextResponse.json({ users: data ?? [] });
}

// POST /api/admin/users — add a user
export async function POST(req: NextRequest) {
  if (!getAdminUser(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: { full_name?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const full_name = body.full_name?.trim();
  const email = body.email?.trim().toLowerCase();

  if (!full_name || !email) {
    return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
  }

  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from('users')
    .insert({ full_name, email })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to add user.' }, { status: 500 });
  }

  return NextResponse.json({ user: data }, { status: 201 });
}
