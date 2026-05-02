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

export default async function ServiceDetailPage({ params }: PageProps) {
  const service = getServiceById(params.id);
  if (!service) notFound();

  const entries = await getEntries(params.id);
  const user = getAuthUser();

  return <ServiceDetailClient service={service} initialEntries={entries} userEmail={user?.email ?? ''} />;
}
