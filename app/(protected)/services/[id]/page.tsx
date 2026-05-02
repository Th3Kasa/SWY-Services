import { notFound } from 'next/navigation';
import { getSupabaseServer, ServiceEntry } from '@/lib/supabase';
import { getServiceById } from '@/lib/services';
import { getAuthUser } from '@/lib/auth';
import { ServiceDetailClient } from './service-detail-client';

interface PageProps {
  params: { id: string };
}

async function getEntries(serviceId: string): Promise<ServiceEntry[]> {
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from('service_entries')
      .select('*')
      .eq('service_id', serviceId)
      .order('date', { ascending: true });

    if (error) throw error;
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
    for (const u of data ?? []) map[u.email] = u.full_name;
    return map;
  } catch {
    return {};
  }
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const service = getServiceById(params.id);
  if (!service) notFound();

  const entries = await getEntries(params.id);
  const submitterNames = await getSubmitterNames(entries);
  const user = getAuthUser();

  return (
    <ServiceDetailClient
      service={service}
      initialEntries={entries}
      submitterNames={submitterNames}
      userEmail={user?.email ?? ''}
    />
  );
}
