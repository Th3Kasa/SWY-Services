import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

const HARDCODED_ADMIN = 'basemmorkos98@gmail.com';

// GET /api/check-admin?email=xxx
// Returns { isAdmin: boolean } — tells the login page whether to show the PIN field.
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')?.trim().toLowerCase();
  if (!email) return NextResponse.json({ isAdmin: false });

  if (email === HARDCODED_ADMIN) return NextResponse.json({ isAdmin: true });

  try {
    const supabase = getSupabaseServer();
    const { data } = await supabase
      .from('users')
      .select('is_admin')
      .eq('email', email)
      .maybeSingle();

    return NextResponse.json({ isAdmin: data?.is_admin === true });
  } catch {
    return NextResponse.json({ isAdmin: false });
  }
}
