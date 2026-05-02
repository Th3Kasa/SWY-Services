import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { COOKIE_NAME, getAuthUserFromCookie } from '@/lib/auth';
import { randomBytes } from 'crypto';

function isAdmin(req: NextRequest): boolean {
  const raw = req.cookies.get(COOKIE_NAME)?.value;
  const user = getAuthUserFromCookie(raw);
  return user?.isAdmin === true;
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function sendAdminInviteEmail(to: string, name: string, token: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://swy-services.vercel.app';
  const setupUrl = `${appUrl}/setup-admin-pin?token=${token}`;

  if (!apiKey) {
    console.log(`[admin invite] DEV — would send to ${to}: ${setupUrl}`);
    return true;
  }

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to,
      subject: "You've been made an admin — set your PIN",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff;">
          <h2 style="color:#1c1917;margin:0 0 8px;">Hi ${escapeHtml(name)} 👋</h2>
          <p style="color:#57534e;margin:0 0 20px;">You've been granted admin access to the St Wanas Youth Services app.</p>
          <p style="color:#57534e;margin:0 0 20px;">To complete your setup, click the button below and choose a 4-digit PIN. You'll use it every time you log in as an admin.</p>
          <a href="${setupUrl}" style="display:inline-block;background:#f59e0b;color:#fff;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:12px;font-size:15px;">Set My Admin PIN →</a>
          <p style="color:#a8a29e;font-size:12px;margin:28px 0 0;">This link expires in 24 hours. If you didn't expect this email, you can safely ignore it.</p>
        </div>`,
    });
    if (error) { console.error('[admin invite] Resend error:', error); return false; }
    return true;
  } catch (err) {
    console.error('[admin invite] Failed to send email:', err);
    return false;
  }
}

// PATCH /api/admin/users/[id]
// Body: { makeAdmin: true } | { removeAdmin: true }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: { makeAdmin?: boolean; removeAdmin?: boolean; resendInvite?: boolean };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }

  const supabase = getSupabaseServer();

  // Fetch the target user first
  const { data: target, error: fetchErr } = await supabase
    .from('users')
    .select('id, full_name, email, is_admin, pin_hash')
    .eq('id', params.id)
    .single();

  if (fetchErr || !target) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  if (body.makeAdmin || body.resendInvite) {
    if (body.resendInvite && !target.is_admin) {
      return NextResponse.json({ error: 'User is not an admin.' }, { status: 400 });
    }

    // Generate a fresh invite token (valid 24h)
    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from('users')
      .update({ is_admin: true, admin_invite_token: token, admin_invite_token_expires_at: expires })
      .eq('id', params.id);

    if (error) return NextResponse.json({ error: 'Failed to update user.' }, { status: 500 });

    const emailSent = await sendAdminInviteEmail(target.email, target.full_name, token);
    if (!emailSent) {
      return NextResponse.json({ error: 'Admin access granted but failed to send invite email. Use "Resend Invite" to try again.' }, { status: 207 });
    }

    return NextResponse.json({ success: true });
  }

  if (body.removeAdmin) {
    const { error } = await supabase
      .from('users')
      .update({ is_admin: false, pin_hash: null, admin_invite_token: null, admin_invite_token_expires_at: null })
      .eq('id', params.id);

    if (error) return NextResponse.json({ error: 'Failed to demote user.' }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Specify makeAdmin or removeAdmin.' }, { status: 400 });
}

// DELETE /api/admin/users/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = getSupabaseServer();
  const { error } = await supabase.from('users').delete().eq('id', params.id);

  if (error) return NextResponse.json({ error: 'Failed to delete user.' }, { status: 500 });
  return NextResponse.json({ success: true });
}
