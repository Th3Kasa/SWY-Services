import { createClient } from '@supabase/supabase-js';

// Types matching the DB schema
export type User = {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
};

export type ServiceEntry = {
  id: string;
  service_id: string;
  date: string;
  team: string;
  what: string;
  created_by_email: string;
  created_at: string;
  reminder_sent: boolean;
};

// Server-side client — uses service role key, never exposed to the browser.
// Only call this from API routes / server components.
export function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local'
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
