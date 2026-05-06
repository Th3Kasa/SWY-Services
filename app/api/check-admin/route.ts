import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

const HARDCODED_ADMIN = 'basemmorkos98@gmail.com';

function toTitleCase(str: string) {
  return str.trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

// GET /api/check-admin?email=xxx&name=yyy
// Returns { isAdmin: boolean, nameMismatch?: boolean }
// nameMismatch is true when the email is an admin but the name doesn't match the DB record.
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')?.trim().toLowerCase();
  const rawName = req.nextUrl.searchParams.get('name') ?? '';
  const name = toTitleCase(rawName);

  if (!email) return NextResponse.json({ isAdmin: false });

  try {
    const supabase = getSupabaseServer();
    const { data } = await supabase
      .from('users')
      .select('is_admin, full_name')
      .eq('email', email)
      .maybeSingle();

    const isAdmin = email === HARDCODED_ADMIN || data?.is_admin === true;
    if (!isAdmin) return NextResponse.json({ isAdmin: false });

    // If a name was provided, verify it matches the DB record
    if (name && data?.full_name && data.full_name.toLowerCase() !== name.toLowerCase()) {
      return NextResponse.json({ isAdmin: false, nameMismatch: true });
    }

    return NextResponse.json({ isAdmin: true });
  } catch {
    return NextResponse.json({ isAdmin: false });
  }
}
