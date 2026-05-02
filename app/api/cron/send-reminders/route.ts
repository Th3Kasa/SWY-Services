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

      const formattedDate = new Date(entry.date + 'T00:00:00').toLocaleDateString('en-AU', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      let allSent = true;

      // 1. Email the submitter
      const submitterSent = await sendEmail({
        to: entry.created_by_email,
        subject: `Reminder: ${service.name} is in 5 days`,
        html: buildSubmitterEmail({
          submitterName,
          serviceName: escapeHtml(service.name),
          formattedDate: escapeHtml(formattedDate),
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
          subject: `Follow-up needed: ${service.name} on ${formattedDate}`,
          html: buildLeaderEmail({
            leaderName: escapeHtml(service.leader),
            submitterName,
            submitterEmail: escapeHtml(entry.created_by_email),
            serviceName: escapeHtml(service.name),
            formattedDate: escapeHtml(formattedDate),
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

function buildSubmitterEmail({
  submitterName,
  serviceName,
  formattedDate,
  team,
  what,
  serviceEmoji,
}: {
  submitterName: string;
  serviceName: string;
  formattedDate: string;
  team: string;
  what: string;
  serviceEmoji: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#fafaf9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafaf9;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <tr>
          <td style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:28px 32px;text-align:center;">
            <div style="font-size:40px;margin-bottom:8px;">${serviceEmoji}</div>
            <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">St Wanas Youth Services</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Service Reminder</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 8px;color:#1c1917;font-size:18px;font-weight:700;">Hi ${submitterName}! 👋</p>
            <p style="margin:0 0 24px;color:#57534e;font-size:15px;line-height:1.7;">
              Just a friendly heads-up — you're running <strong style="color:#1c1917;">${serviceName}</strong> in <strong style="color:#d97706;">5 days</strong>. Make sure you're all prepared and ready to go! 🙌
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;margin-bottom:24px;">
              <tr><td style="padding:20px 24px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr><td style="padding:8px 0;border-bottom:1px solid #fef3c7;">
                    <span style="color:#92400e;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">📅 Date</span><br />
                    <span style="color:#1c1917;font-size:15px;font-weight:600;margin-top:3px;display:block;">${formattedDate}</span>
                  </td></tr>
                  <tr><td style="padding:8px 0;border-bottom:1px solid #fef3c7;">
                    <span style="color:#92400e;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">🎯 Service</span><br />
                    <span style="color:#1c1917;font-size:15px;font-weight:600;margin-top:3px;display:block;">${serviceName}</span>
                  </td></tr>
                  <tr><td style="padding:8px 0;border-bottom:1px solid #fef3c7;">
                    <span style="color:#92400e;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">👥 Team</span><br />
                    <span style="color:#1c1917;font-size:15px;margin-top:3px;display:block;">${team}</span>
                  </td></tr>
                  <tr><td style="padding:8px 0;">
                    <span style="color:#92400e;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">📋 What you're doing</span><br />
                    <span style="color:#1c1917;font-size:15px;margin-top:3px;display:block;">${what}</span>
                  </td></tr>
                </table>
              </td></tr>
            </table>
            <p style="margin:0 0 8px;color:#57534e;font-size:14px;line-height:1.6;">
              If you can't make it or need help, please reach out to your service leader as soon as possible so they can arrange a replacement in time.
            </p>
            <p style="margin:0;color:#a8a29e;font-size:12px;margin-top:20px;">
              This reminder was sent automatically by the St Wanas Youth Services scheduling app.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f5f5f4;padding:16px 32px;text-align:center;">
            <p style="margin:0;color:#a8a29e;font-size:12px;">St Wanas Coptic Orthodox Church · Youth Group</p>
          </td>
        </tr>
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
  formattedDate,
  team,
  what,
  serviceEmoji,
}: {
  leaderName: string;
  submitterName: string;
  submitterEmail: string;
  serviceName: string;
  formattedDate: string;
  team: string;
  what: string;
  serviceEmoji: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#fafaf9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafaf9;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <tr>
          <td style="background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:28px 32px;text-align:center;">
            <div style="font-size:40px;margin-bottom:8px;">${serviceEmoji}</div>
            <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">St Wanas Youth Services</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Leader Follow-Up Reminder</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 8px;color:#1c1917;font-size:18px;font-weight:700;">Hi ${leaderName}! 👋</p>
            <p style="margin:0 0 24px;color:#57534e;font-size:15px;line-height:1.7;">
              <strong style="color:#1c1917;">${submitterName}</strong> is running <strong style="color:#1c1917;">${serviceName}</strong> in <strong style="color:#7c3aed;">5 days</strong>. We've already sent them a reminder — but as the service leader, please follow up with them to make sure they're all set. If they can't make it, now's the time to find a replacement! 💪
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:12px;margin-bottom:24px;">
              <tr><td style="padding:20px 24px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr><td style="padding:8px 0;border-bottom:1px solid #ede9fe;">
                    <span style="color:#5b21b6;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">📅 Date</span><br />
                    <span style="color:#1c1917;font-size:15px;font-weight:600;margin-top:3px;display:block;">${formattedDate}</span>
                  </td></tr>
                  <tr><td style="padding:8px 0;border-bottom:1px solid #ede9fe;">
                    <span style="color:#5b21b6;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">🎯 Service</span><br />
                    <span style="color:#1c1917;font-size:15px;font-weight:600;margin-top:3px;display:block;">${serviceName}</span>
                  </td></tr>
                  <tr><td style="padding:8px 0;border-bottom:1px solid #ede9fe;">
                    <span style="color:#5b21b6;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">👤 Running it</span><br />
                    <span style="color:#1c1917;font-size:15px;margin-top:3px;display:block;">${submitterName} <span style="color:#a8a29e;font-size:13px;">(${submitterEmail})</span></span>
                  </td></tr>
                  <tr><td style="padding:8px 0;border-bottom:1px solid #ede9fe;">
                    <span style="color:#5b21b6;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">👥 Full Team</span><br />
                    <span style="color:#1c1917;font-size:15px;margin-top:3px;display:block;">${team}</span>
                  </td></tr>
                  <tr><td style="padding:8px 0;">
                    <span style="color:#5b21b6;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">📋 What they're doing</span><br />
                    <span style="color:#1c1917;font-size:15px;margin-top:3px;display:block;">${what}</span>
                  </td></tr>
                </table>
              </td></tr>
            </table>
            <p style="margin:0;color:#a8a29e;font-size:12px;margin-top:20px;">
              This reminder was sent automatically by the St Wanas Youth Services scheduling app.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f5f5f4;padding:16px 32px;text-align:center;">
            <p style="margin:0;color:#a8a29e;font-size:12px;">St Wanas Coptic Orthodox Church · Youth Group</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
