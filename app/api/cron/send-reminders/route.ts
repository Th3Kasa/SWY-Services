import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { getServiceById } from '@/lib/services';
import { buildSubmitterEmail, buildLeaderEmail, formatDateParts, escapeHtml } from '@/lib/emails';

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

      const { data: submitter } = await supabase
        .from('users')
        .select('full_name')
        .eq('email', entry.created_by_email)
        .maybeSingle();

      const submitterName = escapeHtml(submitter?.full_name ?? entry.team);
      const { weekday, monthName, dayNum, numericDate } = formatDateParts(entry.date);

      const sharedCtx = {
        serviceName: escapeHtml(service.name),
        weekday: escapeHtml(weekday),
        dayNum,
        monthName: escapeHtml(monthName),
        numericDate,
        team: escapeHtml(entry.team),
        what: escapeHtml(entry.what),
        serviceEmoji: service.iconEmoji,
      };

      let allSent = true;

      const submitterSent = await sendEmail({
        to: entry.created_by_email,
        subject: `Reminder: ${service.name} is in 5 days (${numericDate})`,
        html: buildSubmitterEmail({ ...sharedCtx, submitterName, leaderName: escapeHtml(service.leader) }),
      });
      if (!submitterSent) allSent = false;

      if (service.leaderEmail) {
        const leaderSent = await sendEmail({
          to: service.leaderEmail,
          subject: `Follow-up: ${service.name} on ${numericDate}`,
          html: buildLeaderEmail({
            ...sharedCtx,
            leaderName: escapeHtml(service.leader),
            submitterName,
            submitterEmail: escapeHtml(entry.created_by_email),
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
