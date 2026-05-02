import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME, getAuthUserFromCookie } from '@/lib/auth';

function isAdmin(req: NextRequest): boolean {
  const raw = req.cookies.get(COOKIE_NAME)?.value;
  return getAuthUserFromCookie(raw)?.isAdmin === true;
}

// POST /api/admin/test-email — sends a test email to the logged-in admin
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const raw = req.cookies.get(COOKIE_NAME)?.value;
  const user = getAuthUserFromCookie(raw)!;

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  if (!apiKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY is not set in environment variables.' }, { status: 500 });
  }

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to: user.email,
      subject: 'St Wanas — Resend test email ✅',
      html: `<div style="font-family:sans-serif;padding:24px;">
        <h2>Resend is working! ✅</h2>
        <p>This test email was sent from the St Wanas admin panel to confirm Resend is correctly configured.</p>
        <p style="color:#a8a29e;font-size:12px;">Sent to: ${user.email}</p>
      </div>`,
    });

    if (error) {
      return NextResponse.json({ error: `Resend error: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, messageId: data?.id });
  } catch (err: any) {
    return NextResponse.json({ error: `Failed: ${err?.message ?? 'Unknown error'}` }, { status: 500 });
  }
}
