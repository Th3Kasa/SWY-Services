// Shared reminder email templates used by both the cron job and the
// admin "test reminder" diagnostic. Keeping them here ensures the test
// always matches what the real cron sends.

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://swy-services.vercel.app';

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export type ReminderContext = {
  serviceName: string;
  weekday: string;
  dayNum: number;
  monthName: string;
  numericDate: string;
  team: string;
  what: string;
  serviceEmoji: string;
};

export function buildSubmitterEmail(
  ctx: ReminderContext & { submitterName: string; leaderName: string }
): string {
  const { submitterName, serviceName, weekday, dayNum, monthName, numericDate, team, what, serviceEmoji, leaderName } = ctx;
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" />
<title>Service Reminder</title>
</head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1c1917;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f5f0e8;padding:24px 12px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #ede4d3;">
        <tr><td style="padding:20px 28px;background:#ffffff;border-bottom:1px solid #f5efe4;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>
            <td style="font-size:13px;font-weight:700;color:#92400e;letter-spacing:0.04em;text-transform:uppercase;">⛪ St Wanas Youth</td>
            <td align="right" style="font-size:11px;color:#a8a29e;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;">Service Reminder</td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:36px 28px 24px;text-align:center;background:linear-gradient(180deg,#fffbeb 0%,#ffffff 100%);">
          <div style="font-size:56px;line-height:1;margin-bottom:6px;">${serviceEmoji}</div>
          <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#a8a29e;letter-spacing:0.08em;text-transform:uppercase;">In</p>
          <p style="margin:0 0 4px;font-size:64px;line-height:1;font-weight:800;color:#d97706;letter-spacing:-0.02em;">5</p>
          <p style="margin:0 0 18px;font-size:18px;font-weight:700;color:#1c1917;">days</p>
          <p style="margin:0;font-size:22px;font-weight:700;color:#1c1917;line-height:1.3;">${serviceName}</p>
          <p style="margin:8px 0 0;font-size:14px;color:#78716c;">${weekday}, ${dayNum} ${monthName} · ${numericDate}</p>
        </td></tr>
        <tr><td style="padding:28px 28px 8px;">
          <p style="margin:0 0 12px;font-size:18px;font-weight:700;color:#1c1917;">Hi ${submitterName} 👋</p>
          <p style="margin:0;font-size:15px;line-height:1.65;color:#57534e;">
            This is your friendly heads-up that you're running <strong style="color:#1c1917;">${serviceName}</strong> in <strong style="color:#d97706;">5 days</strong>. A good time to start getting things ready! 🙌
          </p>
        </td></tr>
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
        <tr><td align="center" style="padding:24px 28px 8px;">
          <a href="${APP_URL}/my-entries" style="display:inline-block;background:#d97706;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:13px 32px;border-radius:12px;">Open in app →</a>
        </td></tr>
        <tr><td style="padding:20px 28px 28px;">
          <p style="margin:0;font-size:13px;line-height:1.6;color:#78716c;">
            If you have any issues or are unable to do this service on <strong>${numericDate}</strong>, please contact your service leader <strong>${leaderName}</strong> as soon as possible so they can arrange a replacement in time.
          </p>
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
}

export function buildLeaderEmail(
  ctx: ReminderContext & { leaderName: string; submitterName: string; submitterEmail: string }
): string {
  const { leaderName, submitterName, submitterEmail, serviceName, weekday, dayNum, monthName, numericDate, team, what, serviceEmoji } = ctx;
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" />
<title>Leader Follow-Up</title>
</head>
<body style="margin:0;padding:0;background:#f0eef5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1c1917;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f0eef5;padding:24px 12px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e2dff0;">
        <tr><td style="padding:20px 28px;background:#ffffff;border-bottom:1px solid #ece9f5;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>
            <td style="font-size:13px;font-weight:700;color:#5b21b6;letter-spacing:0.04em;text-transform:uppercase;">⛪ St Wanas Youth</td>
            <td align="right" style="font-size:11px;color:#a8a29e;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;">Leader Follow-Up</td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:36px 28px 24px;text-align:center;background:linear-gradient(180deg,#f5f3ff 0%,#ffffff 100%);">
          <div style="font-size:56px;line-height:1;margin-bottom:6px;">${serviceEmoji}</div>
          <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#a8a29e;letter-spacing:0.08em;text-transform:uppercase;">In</p>
          <p style="margin:0 0 4px;font-size:64px;line-height:1;font-weight:800;color:#7c3aed;letter-spacing:-0.02em;">5</p>
          <p style="margin:0 0 18px;font-size:18px;font-weight:700;color:#1c1917;">days</p>
          <p style="margin:0;font-size:22px;font-weight:700;color:#1c1917;line-height:1.3;">${serviceName}</p>
          <p style="margin:8px 0 0;font-size:14px;color:#78716c;">${weekday}, ${dayNum} ${monthName} · ${numericDate}</p>
        </td></tr>
        <tr><td style="padding:28px 28px 8px;">
          <p style="margin:0 0 12px;font-size:18px;font-weight:700;color:#1c1917;">Hi ${leaderName} 👋</p>
          <p style="margin:0;font-size:15px;line-height:1.65;color:#57534e;">
            <strong style="color:#1c1917;">${submitterName}</strong> is running <strong style="color:#1c1917;">${serviceName}</strong> in <strong style="color:#7c3aed;">5 days</strong>. They've also been reminded — as the service leader, please follow up to make sure they're all set, or arrange a replacement if they can't make it. 💪
          </p>
        </td></tr>
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
        <tr><td align="center" style="padding:24px 28px 8px;">
          <a href="${APP_URL}/calendar" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:13px 32px;border-radius:12px;">View calendar →</a>
        </td></tr>
        <tr><td style="padding:20px 28px 28px;">
          <p style="margin:0;font-size:13px;line-height:1.6;color:#78716c;">
            Tip: Reach out to ${submitterName} now — there's still time to swap if anything has changed.
          </p>
        </td></tr>
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

export function formatDateParts(dateStr: string) {
  const dateObj = new Date(dateStr + 'T00:00:00');
  const weekday = dateObj.toLocaleDateString('en-AU', { weekday: 'long' });
  const monthName = dateObj.toLocaleDateString('en-AU', { month: 'long' });
  const dayNum = dateObj.getDate();
  const yearNum = dateObj.getFullYear();
  const numericDate = `${String(dayNum).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${yearNum}`;
  return { weekday, monthName, dayNum, numericDate };
}
