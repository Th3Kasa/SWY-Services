-- St Wanas Services — Supabase Schema
-- Paste this entire file into the Supabase SQL Editor and click "Run"

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  created_at timestamptz default now()
);

create table if not exists service_entries (
  id uuid primary key default gen_random_uuid(),
  service_id text not null,           -- e.g. 'monthly-outings'
  date date not null,
  team text not null,
  what text not null,
  created_by_email text not null references users(email),
  created_at timestamptz default now(),
  reminder_sent boolean default false
);

create index if not exists service_entries_service_id_date_idx on service_entries (service_id, date);
create index if not exists service_entries_date_reminder_idx on service_entries (date) where reminder_sent = false;

-- NOTE: Row Level Security (RLS) is intentionally disabled.
-- All DB access goes through server-side API routes using the service role key,
-- which bypasses RLS anyway. Do not expose the service role key to the client.
