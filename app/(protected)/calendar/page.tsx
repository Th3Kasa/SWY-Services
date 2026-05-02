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

export default async function CalendarPage() {
  const entries = await getAllEntries();
  return <CalendarClient entries={entries} services={SERVICES} />;
}
