import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { getServiceById } from '@/lib/services';

// GET /api/cron/send-reminders
// Protected by CRON_SECRET header.
// Finds service entries happening exactly 7 days from today,
// emails the service leader, and marks reminder_sent = true.

export async function GET(req: NextRequest) {
  // Security check
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret');
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Calculate target date (7 days from today)
  const target = new Date();
  target.setDate(target.getDate() + 7);
  const targetDate = target.toISOString().split('T')[0]; // YYYY-MM-DD

  try {
    const supabase = getSupabaseServer();

    // Find entries due in 7 days that haven't had a reminder sent
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

    console.log(`[cron] Sending ${entries.length} reminder(s) for ${targetDate}`);

    const results: { id: string; status: 'sent' | 'skipped' | 'error'; reason?: string }[] = [];

    for (const entry of entries) {
      const service = getServiceById(entry.service_id);
      if (!service) {
        results.push({ id: entry.id, status: 'skipped', reason: 'Unknown service' });
        continue;
      }

      const sent = await sendReminderEmail({
        to: service.leaderEmail,
        serviceName: service.name,
        leaderName: service.leader,
        date: entry.date,
        team: entry.team,
        what: entry.what,
      });

      if (sent) {
        // Mark as sent
        await supabase
          .from('service_entries')
          .update({ reminder_sent: true })
          .eq('id', entry.id);

        results.push({ id: entry.id, status: 'sent' });
      } else {
        results.push({ id: entry.id, status: 'error', reason: 'Email failed' });
      }
    }

    return NextResponse.json({ sent: results.filter((r) => r.status === 'sent').length, results });
  } catch (err) {
    console.error('[cron] send-reminders error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function sendReminderEmail({
  to,
  serviceName,
  leaderName,
  date,
  team,
  what,
}: {
  to: string;
  serviceName: string;
  leaderName: string;
  date: string;
  team: string;
  what: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  if (!apiKey) {
    // In dev without Resend configured, just log
    console.log(`[cron] Would send email to ${to}:`);
    console.log(`  Subject: Reminder: ${serviceName} is in 7 days`);
    console.log(`  Date: ${date}, Team: ${team}, What: ${what}`);
    return true; // Don't throw in dev
  }

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);

    const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-AU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const { error } = await resend.emails.send({
      from,
      to,
      subject: `Reminder: ${serviceName} is in 7 days`,
      html: buildEmailHtml({ serviceName, leaderName, formattedDate, team, what }),
    });

    if (error) {
      console.error('[cron] Resend error:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[cron] Failed to send email:', err);
    return false;
  }
}

function buildEmailHtml({
  serviceName,
  leaderName,
  formattedDate,
  team,
  what,
}: {
  serviceName: string;
  leaderName: string;
  formattedDate: string;
  team: string;
  what: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Service Reminder</title>
</head>
<body style="margin:0;padding:0;background:#fafaf9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafaf9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:28px 32px;text-align:center;">
              <div style="font-size:36px;margin-bottom:8px;">⛪</div>
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">St Wanas Services</h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Service Reminder</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 24px;color:#57534e;font-size:15px;line-height:1.6;">
                Hi ${leaderName},<br /><br />
                This is a friendly reminder that <strong style="color:#1c1917;">${serviceName}</strong> is coming up in <strong style="color:#d97706;">7 days</strong>.
              </p>

              <!-- Details card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:6px 0;border-bottom:1px solid #fef3c7;">
                          <span style="color:#92400e;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">📅 Date</span><br />
                          <span style="color:#1c1917;font-size:15px;font-weight:600;">${formattedDate}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;border-bottom:1px solid #fef3c7;">
                          <span style="color:#92400e;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">👥 Team</span><br />
                          <span style="color:#1c1917;font-size:15px;">${team}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;">
                          <span style="color:#92400e;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">📋 What</span><br />
                          <span style="color:#1c1917;font-size:15px;">${what}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:0;color:#a8a29e;font-size:13px;">
                This reminder was sent automatically by the St Wanas Services scheduling app.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f5f5f4;padding:16px 32px;text-align:center;">
              <p style="margin:0;color:#a8a29e;font-size:12px;">St Wanas Coptic Orthodox Church Youth Group</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
