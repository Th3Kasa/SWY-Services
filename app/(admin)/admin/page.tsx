import { getAuthUser } from '@/lib/auth';
import { getSupabaseServer } from '@/lib/supabase';
import { AdminClient } from './admin-client';

export const dynamic = 'force-dynamic';

async function getAllUsers(): Promise<Record<string, string>> {
  try {
    const supabase = getSupabaseServer();
    const { data } = await supabase.from('users').select('email, full_name');
    const map: Record<string, string> = {};
    data?.forEach((u) => {
      map[u.email] = u.full_name;
    });
    return map;
  } catch {
    return {};
  }
}

export default async function AdminPage() {
  const user = getAuthUser()!;
  const userNames = await getAllUsers();
  return <AdminClient adminName={user.name} userNames={userNames} />;
}
