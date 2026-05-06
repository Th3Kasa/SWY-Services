import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { getServiceById } from '@/lib/services';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// GET /api/cron/send-reminders
// Runs daily at 3pm AEST (5am UTC) via Vercel Cron.
// Finds entries happening exactly 5 days from today,
// emails the submitter a personal reminder and (if applicable) the service
// leader a follow-up prompt. Marks reminder_sent = true when done.

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret');
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const target = new Date();
  target.setDate(target.getDate() + 5);
  const targetDate = target.toISOString().split('T')[0];

  try {
    const supabase = getSupabaseServer();

    const { data: entries, error } = await supabase
      .from('service_entries')
      .select('*')
      .eq('date', targetDate)
      .eq('reminder_sent', false);

    if (error) throw error;

    if (!entries || entries.length === 0) {
      console.log(`[cron] No reminders to send for ${targetDate}`);
      return NextResponse.json({ sent: 0, date: targetDate });
    }

    console.log(`[cron] Processing ${entries.length} reminder(s) for ${targetDate}`);

    const results: { id: string; status: 'sent' | 'skipped' | 'error'; reason?: string }[] = [];

    for (const entry of entries) {
      const service = getServiceById(entry.service_id);
      if (!service) {
        results.push({ id: entry.id, status: 'skipped', reason: 'Unknown service' });
        continue;
      }

      // Look up the submitter's full name
      const { data: submitter } = await supabase
        .from('users')
        .select('full_name')
        .eq('email', entry.created_by_email)
        .maybeSingle();

      const submitterName = escapeHtml(submitter?.full_name ?? entry.team);

      const dateObj = new Date(entry.date + 'T00:00:00');
      const weekday = dateObj.toLocaleDateString('en-AU', { weekday: 'long' });
      const monthName = dateObj.toLocaleDateString('en-AU', { month: 'long' });
      const dayNum = dateObj.getDate();
      const yearNum = dateObj.getFullYear();
      const numericDate = `${String(dayNum).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${yearNum}`;
      const formattedDate = `${weekday}, ${dayNum} ${monthName} ${yearNum}`;

      let allSent = true;

      // 1. Email the submitter
      const submitterSent = await sendEmail({
        to: entry.created_by_email,
        subject: `Reminder: ${service.name} is in 5 days (${numericDate})`,
        html: buildSubmitterEmail({
          submitterName,
          serviceName: escapeHtml(service.name),
          weekday: escapeHtml(weekday),
          dayNum,
          monthName: escapeHtml(monthName),
          numericDate,
          team: escapeHtml(entry.team),
          what: escapeHtml(entry.what),
          serviceEmoji: service.iconEmoji,
        }),
      });
      if (!submitterSent) allSent = false;

      // 2. Email the leader (skip for Uncle Gamal's Juice)
      if (service.leaderEmail) {
        const leaderSent = await sendEmail({
          to: service.leaderEmail,
          subject: `Follow-up: ${service.name} on ${numericDate}`,
          html: buildLeaderEmail({
            leaderName: escapeHtml(service.leader),
            submitterName,
            submitterEmail: escapeHtml(entry.created_by_email),
            serviceName: escapeHtml(service.name),
            weekday: escapeHtml(weekday),
            dayNum,
            monthName: escapeHtml(monthName),
            numericDate,
            team: escapeHtml(entry.team),
            what: escapeHtml(entry.what),
            serviceEmoji: service.iconEmoji,
          }),
        });
        if (!leaderSent) allSent = false;
      }

      if (allSent) {
        await supabase
          .from('service_entries')
          .update({ reminder_sent: true })
          .eq('id', entry.id);
        results.push({ id: entry.id, status: 'sent' });
      } else {
        results.push({ id: entry.id, status: 'error', reason: 'One or more emails failed' });
      }
    }

    return NextResponse.json({
      sent: results.filter((r) => r.status === 'sent').length,
      results,
      date: targetDate,
    });
  } catch (err) {
    console.error('[cron] send-reminders error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  if (!apiKey) {
    console.log(`[cron] DEV — would send to ${to}: ${subject}`);
    return true;
  }

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({ from, to, subject, html });
    if (error) { console.error('[cron] Resend error:', error); return false; }
    return true;
  } catch (err) {
    console.error('[cron] Failed to send email:', err);
    return false;
  }
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://swy-services.vercel.app';

function buildSubmitterEmail({
  submitterName,
  serviceName,
  weekday,
  dayNum,
  monthName,
  numericDate,
  team,
  what,
  serviceEmoji,
}: {
  submitterName: string;
  serviceName: string;
  weekday: string;
  dayNum: number;
  monthName: string;
  numericDate: string;
  team: string;
  what: string;
  serviceEmoji: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" />
<title>Service Reminder</title>
</head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1c1917;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f5f0e8;padding:24px 12px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #ede4d3;">

        <!-- Brand bar -->
        <tr><td style="padding:20px 28px;background:#ffffff;border-bottom:1px solid #f5efe4;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>
            <td style="font-size:13px;font-weight:700;color:#92400e;letter-spacing:0.04em;text-transform:uppercase;">⛪ St Wanas Youth</td>
            <td align="right" style="font-size:11px;color:#a8a29e;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;">Service Reminder</td>
          </tr></table>
        </td></tr>

        <!-- Hero countdown -->
        <tr><td style="padding:36px 28px 24px;text-align:center;background:linear-gradient(180deg,#fffbeb 0%,#ffffff 100%);">
          <div style="font-size:56px;line-height:1;margin-bottom:6px;">${serviceEmoji}</div>
          <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#a8a29e;letter-spacing:0.08em;text-transform:uppercase;">In</p>
          <p style="margin:0 0 4px;font-size:64px;line-height:1;font-weight:800;color:#d97706;letter-spacing:-0.02em;">5</p>
          <p style="margin:0 0 18px;font-size:18px;font-weight:700;color:#1c1917;">days</p>
          <p style="margin:0;font-size:22px;font-weight:700;color:#1c1917;line-height:1.3;">${serviceName}</p>
          <p style="margin:8px 0 0;font-size:14px;color:#78716c;">${weekday}, ${dayNum} ${monthName} · ${numericDate}</p>
        </td></tr>

        <!-- Greeting -->
        <tr><td style="padding:28px 28px 8px;">
          <p style="margin:0 0 12px;font-size:18px;font-weight:700;color:#1c1917;">Hi ${submitterName} 👋</p>
          <p style="margin:0;font-size:15px;line-height:1.65;color:#57534e;">
            This is your friendly heads-up that you're running <strong style="color:#1c1917;">${serviceName}</strong> in <strong style="color:#d97706;">5 days</strong>. A good time to start getting things ready! 🙌
          </p>
        </td></tr>

        <!-- Details card -->
        <tr><td style="padding:20px 28px 8px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #ede4d3;border-radius:14px;background:#fdfaf3;">
            <tr><td style="padding:18px 20px;border-bottom:1px solid #f5efe4;">
              <p style="margin:0 0 2px;font-size:11px;font-weight:700;color:#a16207;text-transform:uppercase;letter-spacing:0.06em;">Team</p>
              <p style="margin:0;font-size:15px;font-weight:600;color:#1c1917;">${team}</p>
            </td></tr>
            <tr><td style="padding:18px 20px;">
              <p style="margin:0 0 2px;font-size:11px;font-weight:700;color:#a16207;text-transform:uppercase;letter-spacing:0.06em;">What you're doing</p>
              <p style="margin:0;font-size:15px;color:#1c1917;line-height:1.5;">${what}</p>
            </td></tr>
          </table>
        </td></tr>

        <!-- CTA -->
        <tr><td align="center" style="padding:24px 28px 8px;">
          <a href="${APP_URL}/my-entries" style="display:inline-block;background:#d97706;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:13px 32px;border-radius:12px;">Open in app →</a>
        </td></tr>

        <!-- Note -->
        <tr><td style="padding:20px 28px 28px;">
          <p style="margin:0;font-size:13px;line-height:1.6;color:#78716c;">
            Can't make it? Please reach out to your service leader as soon as possible so a replacement can be arranged.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#fafaf9;padding:18px 28px;text-align:center;border-top:1px solid #f5efe4;">
          <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#78716c;">St Wanas Coptic Orthodox Church · Youth Group</p>
          <p style="margin:0;font-size:11px;color:#a8a29e;">Sent automatically · Please don't reply to this email.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildLeaderEmail({
  leaderName,
  submitterName,
  submitterEmail,
  serviceName,
  weekday,
  dayNum,
  monthName,
  numericDate,
  team,
  what,
  serviceEmoji,
}: {
  leaderName: string;
  submitterName: string;
  submitterEmail: string;
  serviceName: string;
  weekday: string;
  dayNum: number;
  monthName: string;
  numericDate: string;
  team: string;
  what: string;
  serviceEmoji: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" />
<title>Leader Follow-Up</title>
</head>
<body style="margin:0;padding:0;background:#f0eef5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1c1917;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f0eef5;padding:24px 12px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e2dff0;">

        <!-- Brand bar -->
        <tr><td style="padding:20px 28px;background:#ffffff;border-bottom:1px solid #ece9f5;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>
            <td style="font-size:13px;font-weight:700;color:#5b21b6;letter-spacing:0.04em;text-transform:uppercase;">⛪ St Wanas Youth</td>
            <td align="right" style="font-size:11px;color:#a8a29e;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;">Leader Follow-Up</td>
          </tr></table>
        </td></tr>

        <!-- Hero countdown -->
        <tr><td style="padding:36px 28px 24px;text-align:center;background:linear-gradient(180deg,#f5f3ff 0%,#ffffff 100%);">
          <div style="font-size:56px;line-height:1;margin-bottom:6px;">${serviceEmoji}</div>
          <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#a8a29e;letter-spacing:0.08em;text-transform:uppercase;">In</p>
          <p style="margin:0 0 4px;font-size:64px;line-height:1;font-weight:800;color:#7c3aed;letter-spacing:-0.02em;">5</p>
          <p style="margin:0 0 18px;font-size:18px;font-weight:700;color:#1c1917;">days</p>
          <p style="margin:0;font-size:22px;font-weight:700;color:#1c1917;line-height:1.3;">${serviceName}</p>
          <p style="margin:8px 0 0;font-size:14px;color:#78716c;">${weekday}, ${dayNum} ${monthName} · ${numericDate}</p>
        </td></tr>

        <!-- Greeting -->
        <tr><td style="padding:28px 28px 8px;">
          <p style="margin:0 0 12px;font-size:18px;font-weight:700;color:#1c1917;">Hi ${leaderName} 👋</p>
          <p style="margin:0;font-size:15px;line-height:1.65;color:#57534e;">
            <strong style="color:#1c1917;">${submitterName}</strong> is running <strong style="color:#1c1917;">${serviceName}</strong> in <strong style="color:#7c3aed;">5 days</strong>. They've also been reminded — as the service leader, please follow up to make sure they're all set, or arrange a replacement if they can't make it. 💪
          </p>
        </td></tr>

        <!-- Details card -->
        <tr><td style="padding:20px 28px 8px;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #e2dff0;border-radius:14px;background:#faf8ff;">
            <tr><td style="padding:18px 20px;border-bottom:1px solid #ece9f5;">
              <p style="margin:0 0 2px;font-size:11px;font-weight:700;color:#6d28d9;text-transform:uppercase;letter-spacing:0.06em;">Running it</p>
              <p style="margin:0;font-size:15px;font-weight:600;color:#1c1917;">${submitterName} <span style="color:#a8a29e;font-size:13px;font-weight:400;">· ${submitterEmail}</span></p>
            </td></tr>
            <tr><td style="padding:18px 20px;border-bottom:1px solid #ece9f5;">
              <p style="margin:0 0 2px;font-size:11px;font-weight:700;color:#6d28d9;text-transform:uppercase;letter-spacing:0.06em;">Full team</p>
              <p style="margin:0;font-size:15px;color:#1c1917;">${team}</p>
            </td></tr>
            <tr><td style="padding:18px 20px;">
              <p style="margin:0 0 2px;font-size:11px;font-weight:700;color:#6d28d9;text-transform:uppercase;letter-spacing:0.06em;">What they're doing</p>
              <p style="margin:0;font-size:15px;color:#1c1917;line-height:1.5;">${what}</p>
            </td></tr>
          </table>
        </td></tr>

        <!-- CTA -->
        <tr><td align="center" style="padding:24px 28px 8px;">
          <a href="${APP_URL}/calendar" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:13px 32px;border-radius:12px;">View calendar →</a>
        </td></tr>

        <!-- Note -->
        <tr><td style="padding:20px 28px 28px;">
          <p style="margin:0;font-size:13px;line-height:1.6;color:#78716c;">
            Tip: Reach out to ${submitterName} now — there's still time to swap if anything has changed.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#fafaf9;padding:18px 28px;text-align:center;border-top:1px solid #ece9f5;">
          <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#78716c;">St Wanas Coptic Orthodox Church · Youth Group</p>
          <p style="margin:0;font-size:11px;color:#a8a29e;">Sent automatically · Please don't reply to this email.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
