import { getAuthUser } from '@/lib/auth';
import { getSupabaseServer, ServiceEntry } from '@/lib/supabase';
import { MyEntriesClient } from './my-entries-client';

async function getUserEntries(email: string, name: string): Promise<ServiceEntry[]> {
  try {
    const supabase = getSupabaseServer();

    // Get entries created by this user OR where their name appears in the team field
    const { data: createdEntries } = await supabase
      .from('service_entries')
      .select('*')
      .eq('created_by_email', email);

    // Case-insensitive substring match on team field
    // We fetch all and filter client-side to avoid complex SQL
    const { data: allEntries } = await supabase
      .from('service_entries')
      .select('*')
      .ilike('team', `%${name}%`);

    // Merge and deduplicate by id
    const seen = new Set<string>();
    const merged: ServiceEntry[] = [];

    for (const entry of [...(createdEntries ?? []), ...(allEntries ?? [])]) {
      if (!seen.has(entry.id)) {
        seen.add(entry.id);
        merged.push(entry);
      }
    }

    // Sort by date ascending (upcoming first)
    merged.sort((a, b) => a.date.localeCompare(b.date));

    return merged;
  } catch {
    return [];
  }
}

export default async function MyEntriesPage() {
  const user = getAuthUser()!; // protected layout guarantees user exists
  const entries = await getUserEntries(user.email, user.name);

  return <MyEntriesClient entries={entries} userName={user.name} />;
}
