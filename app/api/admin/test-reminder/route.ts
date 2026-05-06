import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME, getAuthUserFromCookie } from '@/lib/auth';
import { getSupabaseServer } from '@/lib/supabase';
import { getServiceById } from '@/lib/services';
import { buildSubmitterEmail, formatDateParts, escapeHtml } from '@/lib/emails';

function isAdmin(req: NextRequest): boolean {
  const raw = req.cookies.get(COOKIE_NAME)?.value;
  return getAuthUserFromCookie(raw)?.isAdmin === true;
}

// POST /api/admin/test-reminder
// Simulates the cron: looks for entries 5 days away and sends a SAMPLE
// reminder email to the admin (or override recipient) using the exact
// same template the real cron uses.
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const raw = req.cookies.get(COOKIE_NAME)?.value;
  const user = getAuthUserFromCookie(raw)!;

  let overrideRecipient: string | undefined;
  try {
    const body = await req.json();
    if (typeof body?.to === 'string' && body.to.trim()) overrideRecipient = body.to.trim().toLowerCase();
  } catch { /* no body */ }
  const recipient = overrideRecipient || user.email;

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  if (!apiKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY is not set.' }, { status: 500 });
  }

  const target = new Date();
  target.setDate(target.getDate() + 5);
  const targetDate = target.toISOString().split('T')[0];

  const supabase = getSupabaseServer();

  const { data: allOnDate } = await supabase
    .from('service_entries')
    .select('id, service_id, date, team, what, created_by_email, reminder_sent')
    .eq('date', targetDate);

  const eligible = (allOnDate ?? []).filter((e) => e.reminder_sent === false);

  if (eligible.length === 0) {
    return NextResponse.json({
      ok: false,
      targetDate,
      reason: allOnDate?.length
        ? `Found ${allOnDate.length} entry on ${targetDate}, but reminders have already been sent. The cron only processes entries where reminder_sent = false.`
        : `No entries dated exactly 5 days from today (${targetDate}). Add a test entry on that date to try this.`,
    });
  }

  const { Resend } = await import('resend');
  const resend = new Resend(apiKey);
  const sentServices: string[] = [];
  const failed: string[] = [];

  for (const entry of eligible) {
    const service = getServiceById(entry.service_id);
    if (!service) continue;

    const { data: submitter } = await supabase
      .from('users')
      .select('full_name')
      .eq('email', entry.created_by_email)
      .maybeSingle();

    const submitterName = escapeHtml(submitter?.full_name ?? entry.team);
    const { weekday, monthName, dayNum, numericDate } = formatDateParts(entry.date);

    const html = buildSubmitterEmail({
      submitterName,
      serviceName: escapeHtml(service.name),
      weekday: escapeHtml(weekday),
      dayNum,
      monthName: escapeHtml(monthName),
      numericDate,
      team: escapeHtml(entry.team),
      what: escapeHtml(entry.what),
      serviceEmoji: service.iconEmoji,
      leaderName: escapeHtml(service.leader),
    });

    const { error } = await resend.emails.send({
      from,
      to: recipient,
      subject: `[TEST] Reminder: ${service.name} is in 5 days (${numericDate})`,
      html,
    });

    if (error) failed.push(`${service.name}: ${error.message}`);
    else sentServices.push(service.name);
  }

  return NextResponse.json({
    ok: sentServices.length > 0,
    sentTo: recipient,
    sentCount: sentServices.length,
    services: sentServices,
    failed,
    targetDate,
  });
}
