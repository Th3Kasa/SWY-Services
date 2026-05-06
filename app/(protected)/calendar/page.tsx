export const dynamic = 'force-dynamic';

import { getSupabaseServer, ServiceEntry } from '@/lib/supabase';
import { SERVICES } from '@/lib/services';
import { CalendarClient } from './calendar-client';

async function getAllEntries(): Promise<ServiceEntry[]> {
  try {
    const supabase = getSupabaseServer();
    const { data } = await supabase
      .from('service_entries')
      .select('*')
      .order('date', { ascending: true });
    return data ?? [];
  } catch {
    return [];
  }
}

async function getSubmitterNames(entries: ServiceEntry[]): Promise<Record<string, string>> {
  const emails = [...new Set(entries.map((e) => e.created_by_email))];
  if (emails.length === 0) return {};
  try {
    const supabase = getSupabaseServer();
    const { data } = await supabase
      .from('users')
      .select('email, full_name')
      .in('email', emails);

    const map: Record<string, string> = {};
    data?.forEach((u) => {
      map[u.email] = u.full_name;
    });
    return map;
  } catch {
    return {};
  }
}

export default async function CalendarPage() {
  const entries = await getAllEntries();
  const submitterNames = await getSubmitterNames(entries);
  return <CalendarClient entries={entries} services={SERVICES} submitterNames={submitterNames} />;
}
