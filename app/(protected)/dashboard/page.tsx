export const dynamic = 'force-dynamic';

import { getSupabaseServer } from '@/lib/supabase';
import { SERVICES } from '@/lib/services';
import { DashboardClient } from '../dashboard-client';

async function getEntryCounts(): Promise<Record<string, number>> {
  try {
    const supabase = getSupabaseServer();
    const today = new Date().toISOString().split('T')[0];

    const { data } = await supabase
      .from('service_entries')
      .select('service_id')
      .gte('date', today);

    const counts: Record<string, number> = {};
    for (const service of SERVICES) {
      counts[service.id] = 0;
    }
    for (const row of data ?? []) {
      if (row.service_id in counts) {
        counts[row.service_id]++;
      }
    }
    return counts;
  } catch {
    // Return zeros if DB not configured yet
    const counts: Record<string, number> = {};
    for (const service of SERVICES) {
      counts[service.id] = 0;
    }
    return counts;
  }
}

export default async function DashboardPage() {
  const counts = await getEntryCounts();

  return <DashboardClient services={SERVICES} counts={counts} />;
}
