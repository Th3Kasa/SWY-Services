import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME, getAuthUserFromCookie } from '@/lib/auth';
import { getSupabaseServer } from '@/lib/supabase';
import { getServiceById } from '@/lib/services';

function isAdmin(req: NextRequest): boolean {
  const raw = req.cookies.get(COOKIE_NAME)?.value;
  return getAuthUserFromCookie(raw)?.isAdmin === true;
}

// POST /api/admin/test-reminder
// Diagnostic: simulates the cron job for the logged-in admin.
// Always sends to the admin's own email (Resend free tier allows that).
// Returns full diagnostic info: target date, matching entries, emails sent/skipped.
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const raw = req.cookies.get(COOKIE_NAME)?.value;
  const user = getAuthUserFromCookie(raw)!;

  // Allow overriding the recipient (useful when Resend account owner != admin email).
  let overrideRecipient: string | undefined;
  try {
    const body = await req.json();
    if (typeof body?.to === 'string' && body.to.trim()) overrideRecipient = body.to.trim().toLowerCase();
  } catch { /* no body, that's fine */ }
  const recipient = overrideRecipient || user.email;

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  if (!apiKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY is not set in environment variables.' }, { status: 500 });
  }

  // Same date logic as the real cron
  const target = new Date();
  target.setDate(target.getDate() + 5);
  const targetDate = target.toISOString().split('T')[0];

  const supabase = getSupabaseServer();

  // List ALL entries for the target date (regardless of reminder_sent) for diagnostics
  const { data: allOnDate } = await supabase
    .from('service_entries')
    .select('id, service_id, date, team, what, created_by_email, reminder_sent')
    .eq('date', targetDate);

  // The actual entries the real cron would process
  const eligible = (allOnDate ?? []).filter((e) => e.reminder_sent === false);

  if (eligible.length === 0) {
    return NextResponse.json({
      ok: false,
      targetDate,
      reason: allOnDate?.length
        ? `Found ${allOnDate.length} entry/entries on ${targetDate}, but all have reminder_sent=true. The cron only sends to entries where reminder_sent=false.`
        : `No entries found dated ${targetDate}. The cron only triggers for entries dated exactly 5 days from today.`,
      entriesOnDate: allOnDate ?? [],
    });
  }

  const { Resend } = await import('resend');
  const resend = new Resend(apiKey);
  const results: Array<{ id: string; service: string; status: string; detail?: string }> = [];

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://swy-services.vercel.app';

  for (const entry of eligible) {
    const service = getServiceById(entry.service_id);
    if (!service) {
      results.push({ id: entry.id, service: entry.service_id, status: 'skipped', detail: 'Unknown service' });
      continue;
    }

    const dateObj = new Date(entry.date + 'T00:00:00');
    const weekday = dateObj.toLocaleDateString('en-AU', { weekday: 'long' });
    const monthName = dateObj.toLocaleDateString('en-AU', { month: 'long' });
    const dayNum = dateObj.getDate();
    const yearNum = dateObj.getFullYear();
    const numericDate = `${String(dayNum).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${yearNum}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1c1917;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f5f0e8;padding:24px 12px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #ede4d3;">
        <tr><td style="padding:14px 28px;background:#fef3c7;border-bottom:1px solid #fde68a;text-align:center;">
          <p style="margin:0;font-size:12px;font-weight:700;color:#92400e;letter-spacing:0.06em;text-transform:uppercase;">🧪 Test Email — Real cron would send to ${entry.created_by_email}</p>
        </td></tr>
        <tr><td style="padding:20px 28px;background:#ffffff;border-bottom:1px solid #f5efe4;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>
            <td style="font-size:13px;font-weight:700;color:#92400e;letter-spacing:0.04em;text-transform:uppercase;">⛪ St Wanas Youth</td>
            <td align="right" style="font-size:11px;color:#a8a29e;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;">Service Reminder</td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:36px 28px 24px;text-align:center;background:linear-gradient(180deg,#fffbeb 0%,#ffffff 100%);">
          <div style="font-size:56px;line-height:1;margin-bottom:6px;">${service.iconEmoji}</div>
          <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#a8a29e;letter-spacing:0.08em;text-transform:uppercase;">In</p>
          <p style="margin:0 0 4px;font-size:64px;line-height:1;font-weight:800;color:#d97706;letter-spacing:-0.02em;">5</p>
          <p style="margin:0 0 18px;font-size:18px;font-weight:700;color:#1c1917;">days</p>
          <p style="margin:0;font-size:22px;font-weight:700;color:#1c1917;line-height:1.3;">${service.name}</p>
          <p style="margin:8px 0 0;font-size:14px;color:#78716c;">${weekday}, ${dayNum} ${monthName} · ${numericDate}</p>
        </td></tr>
        <tr><td style="padding:20px 28px 8px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #ede4d3;border-radius:14px;background:#fdfaf3;">
            <tr><td style="padding:18px 20px;border-bottom:1px solid #f5efe4;">
              <p style="margin:0 0 2px;font-size:11px;font-weight:700;color:#a16207;text-transform:uppercase;letter-spacing:0.06em;">Team</p>
              <p style="margin:0;font-size:15px;font-weight:600;color:#1c1917;">${entry.team}</p>
            </td></tr>
            <tr><td style="padding:18px 20px;">
              <p style="margin:0 0 2px;font-size:11px;font-weight:700;color:#a16207;text-transform:uppercase;letter-spacing:0.06em;">What you're doing</p>
              <p style="margin:0;font-size:15px;color:#1c1917;line-height:1.5;">${entry.what}</p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td align="center" style="padding:24px 28px 8px;">
          <a href="${APP_URL}/my-entries" style="display:inline-block;background:#d97706;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:13px 32px;border-radius:12px;">Open in app →</a>
        </td></tr>
        <tr><td style="background:#fafaf9;padding:18px 28px;text-align:center;border-top:1px solid #f5efe4;">
          <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#78716c;">St Wanas Coptic Orthodox Church · Youth Group</p>
          <p style="margin:0;font-size:11px;color:#a8a29e;">Sent automatically · Please don't reply to this email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const { error } = await resend.emails.send({
      from,
      to: recipient,
      subject: `[TEST] Reminder: ${service.name} is in 5 days (${numericDate})`,
      html,
    });

    if (error) {
      results.push({ id: entry.id, service: service.name, status: 'failed', detail: error.message });
    } else {
      results.push({ id: entry.id, service: service.name, status: 'sent', detail: `Test email sent to ${recipient}` });
    }
  }

  return NextResponse.json({
    ok: results.some((r) => r.status === 'sent'),
    targetDate,
    sentTo: recipient,
    fromAddress: from,
    results,
  });
}
