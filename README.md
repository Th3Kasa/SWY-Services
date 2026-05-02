# St Wanas Services

A service scheduling web app for the St Wanas Coptic Orthodox Church youth group. Members sign in with their name and email, then log and view entries for the group's 7 recurring services.

---

## What the app does

- **7 services** are pre-configured (Monthly Outings, Friday Night Outings, Fundraising Events, Friday Night Cooking & Birthdays, Orban Making, Cleaning, Uncle Gamal's Juice).
- Members sign in with just a name + email — no password needed.
- Each service has a schedule page where members can add entries with a date, the team involved, and what's happening.
- A personal "My Entries" page shows everything a member created or is part of.
- A daily cron job (via Vercel Cron) emails service leaders 7 days before each upcoming entry.

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + custom shadcn-style components |
| Animations | Framer Motion |
| Database | Supabase (Postgres, free tier) |
| Email | Resend (free tier, 3 000 emails/month) |
| Scheduling | Vercel Cron |
| Hosting | Vercel (free hobby tier) |

---

## Setup (local development)

### 1. Clone and install

```bash
git clone <your-github-repo-url>
cd st-wanas-services
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free account.
2. Create a new project (pick any region, set a database password you can remember).
3. Once the project is ready, go to **Project Settings → API**.
4. Copy:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **service_role** key (under "Project API keys" — the secret one, NOT the anon key)

### 3. Run the database schema

1. In your Supabase project, go to **SQL Editor**.
2. Open the file `supabase/schema.sql` from this repo.
3. Paste the entire contents into the SQL editor and click **Run**.

> **Note:** Row Level Security (RLS) is intentionally disabled. All database access happens through server-side API routes using the service role key, which bypasses RLS. Never expose the service role key to the browser.

### 4. Create a Resend account (for email reminders)

1. Go to [resend.com](https://resend.com) and sign up for free.
2. Go to **API Keys** and create a new key.
3. Copy the key (starts with `re_`).

> You can skip Resend for local development — if `RESEND_API_KEY` is missing, the cron route will log reminder details to the console instead of throwing.

### 5. Set environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=onboarding@resend.dev
CRON_SECRET=pick-any-random-string
```

> For `RESEND_FROM_EMAIL`: while testing, use `onboarding@resend.dev` (Resend's free sandbox sender). Once you have a verified domain, replace it with your own.

### 6. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to the login page.

---

## Deploy to Vercel

1. Push your code to a GitHub repository.
2. Go to [vercel.com](https://vercel.com) and import the repository.
3. In the Vercel project settings, go to **Environment Variables** and add all 5 variables from `.env.example` with your real values.
4. Deploy. Vercel will automatically detect Next.js and configure the build.

### Vercel Cron

The `vercel.json` file configures a daily cron job:

```json
{
  "crons": [{ "path": "/api/cron/send-reminders", "schedule": "0 9 * * *" }]
}
```

This runs every day at 9:00 AM UTC. Vercel calls `/api/cron/send-reminders` with an `Authorization` header — but this app uses `x-cron-secret` for simplicity. Vercel Cron calls work automatically once deployed; no extra setup needed.

> To manually test the cron route, call:
> `GET /api/cron/send-reminders?secret=your-CRON_SECRET`

---

## How to edit service leaders and emails

Open `lib/services.ts`. Each service is an object in the `SERVICES` array:

```ts
{
  id: 'monthly-outings',
  name: 'Monthly Outings',
  leader: 'Michael Malek',
  leaderEmail: 'michael.malek@placeholder.com', // <-- change this
  frequency: 'Monthly',
  // ... colors etc
}
```

Change `leader` and `leaderEmail` to the real values. Save the file and redeploy (or the dev server will hot-reload).

---

## How the weekly reminder works

1. Every day at 9 AM UTC, Vercel Cron calls `GET /api/cron/send-reminders`.
2. The route queries Supabase for any `service_entries` where:
   - `date` is exactly 7 days from today
   - `reminder_sent` is `false`
3. For each matching entry, it looks up the service's leader email from `lib/services.ts`.
4. It sends an email via Resend with the date, team, and activity description.
5. It marks `reminder_sent = true` on each entry so duplicates are never sent.

---

## Project structure

```
app/
  (protected)/          # Route group — requires auth cookie
    layout.tsx          # Auth check + Nav wrapper
    dashboard/          # /dashboard — service cards grid
    services/[id]/      # /services/monthly-outings etc
    my-entries/         # /my-entries
  api/
    login/              # POST — upsert user, set cookie
    logout/             # POST — clear cookie
    entries/            # GET (list) + POST (create)
    cron/send-reminders/# GET — daily reminder job
  login/                # /login page
  layout.tsx            # Root layout (font, metadata)
  page.tsx              # Redirects / → /dashboard or /login

components/
  nav.tsx               # Top navigation bar
  add-entry-form.tsx    # Reusable form for adding entries
  ui/                   # Button, Card, Input, Modal, Badge, Skeleton

lib/
  services.ts           # 7 service configs (EDIT EMAILS HERE)
  supabase.ts           # Supabase server client + types
  auth.ts               # Cookie read/write helpers
  utils.ts              # cn(), formatDate(), isUpcoming()

supabase/
  schema.sql            # Paste into Supabase SQL editor

vercel.json             # Cron schedule config
```
