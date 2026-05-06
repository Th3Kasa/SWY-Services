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

  for (const entry of eligible) {
    const service = getServiceById(entry.service_id);
    if (!service) {
      results.push({ id: entry.id, service: entry.service_id, status: 'skipped', detail: 'Unknown service' });
      continue;
    }

    const { error } = await resend.emails.send({
      from,
      to: user.email, // force-send to admin (works on Resend free tier)
      subject: `[TEST] Reminder: ${service.name} is in 5 days`,
      html: `<div style="font-family:sans-serif;padding:24px;max-width:600px;">
        <h2>🧪 Test Reminder Email</h2>
        <p>This is a test of the reminder system. The real cron would have sent this to <strong>${entry.created_by_email}</strong>.</p>
        <hr style="margin:20px 0;border:none;border-top:1px solid #e7e5e4;" />
        <p><strong>Service:</strong> ${service.name} ${service.iconEmoji}</p>
        <p><strong>Date:</strong> ${entry.date}</p>
        <p><strong>Team:</strong> ${entry.team}</p>
        <p><strong>What:</strong> ${entry.what}</p>
        <p><strong>Submitter:</strong> ${entry.created_by_email}</p>
        <p style="color:#a8a29e;font-size:12px;margin-top:24px;">If you received this, the reminder system is working. ✅</p>
      </div>`,
    });

    if (error) {
      results.push({ id: entry.id, service: service.name, status: 'failed', detail: error.message });
    } else {
      results.push({ id: entry.id, service: service.name, status: 'sent', detail: `Test email sent to ${user.email}` });
    }
  }

  return NextResponse.json({
    ok: results.some((r) => r.status === 'sent'),
    targetDate,
    sentTo: user.email,
    fromAddress: from,
    results,
  });
}
