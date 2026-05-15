'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ServiceConfig } from '@/lib/services';

const WHAT_MAX = 200;

interface AddEntryFormProps {
  service: ServiceConfig;
  onSuccess?: () => void;
}

export function AddEntryForm({ service, onSuccess }: AddEntryFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ date: '', team: '', what: '' });
  const [savedDate, setSavedDate] = useState<string | null>(null);

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.date) errs.date = 'Date is required';
    if (!form.team.trim()) errs.team = 'Team / who is required';
    if (!form.what.trim()) errs.what = 'Activity description is required';
    if (form.what.length > WHAT_MAX) errs.what = `Max ${WHAT_MAX} characters`;
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: service.id,
          date: form.date,
          team: form.team,
          what: form.what,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        setErrors({ submit: data.error || 'Something went wrong. Please try again.' });
        return;
      }

      setSavedDate(form.date);
      setForm({ date: '', team: '', what: '' });
      router.refresh();
      onSuccess?.();
    } catch {
      setErrors({ submit: 'Network error. Please check your connection.' });
    } finally {
      setLoading(false);
    }
  }

  const whatLen = form.what.length;
  const nearLimit = whatLen >= WHAT_MAX * 0.85;
  const atLimit = whatLen >= WHAT_MAX;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Date"
        type="date"
        lang="en-GB"
        required
        value={form.date}
        onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
        error={errors.date}
      />
      <Input
        label="Team / Who"
        placeholder="e.g. Simon, Andrew, Joey"
        required
        value={form.team}
        onChange={(e) => setForm((f) => ({ ...f, team: e.target.value }))}
        error={errors.team}
        helperText="Names of everyone involved"
      />

      {/* What field with character counter */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-stone-700">
          What <span className="ml-1 text-rose-500">*</span>
        </label>
        <textarea
          placeholder="e.g. Church Sleepover"
          required
          rows={3}
          maxLength={WHAT_MAX}
          value={form.what}
          onChange={(e) => setForm((f) => ({ ...f, what: e.target.value }))}
          className={[
            'w-full rounded-xl border bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400',
            'transition-all duration-200 outline-none resize-none',
            'focus:ring-2',
            errors.what
              ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-100'
              : 'border-stone-200 focus:border-amber-400 focus:ring-amber-100',
          ].join(' ')}
        />
        <div className="flex items-center justify-between">
          {errors.what ? (
            <p className="text-xs text-rose-600 flex items-center gap-1">
              <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              {errors.what}
            </p>
          ) : (
            <p className="text-xs text-stone-400">Describe the activity</p>
          )}
          <span className={`text-xs font-medium tabular-nums ${atLimit ? 'text-rose-600' : nearLimit ? 'text-amber-600' : 'text-stone-400'}`}>
            {whatLen}/{WHAT_MAX}
          </span>
        </div>
      </div>

      {errors.submit && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
          {errors.submit}
        </div>
      )}

      <Button type="submit" isLoading={loading} className="w-full">
        Save Entry'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ServiceConfig } from '@/lib/services';

const WHAT_MAX = 200;

interface AddEntryFormProps {
  service: ServiceConfig;
  onSuccess?: () => void;
}

const SERVICE_PLACEHOLDERS: Record<string, { team: string; what: string }> = {
  'monthly-outings': {
    team: 'e.g. Michael, Sarah, Joey',
    what: 'e.g. Zoo Trip, Movie Night, Bowling',
  },
  'friday-night-outings': {
    team: 'e.g. Andre, Michael, Ibby',
    what: 'e.g. Laser Tag, Escape Room, Mini Golf',
  },
  'fundraising-events': {
    team: 'e.g. Angelina, Sarah, Daniel',
    what: 'e.g. Bake Sale, Car Wash, Raffle Night',
  },
  'friday-cooking-birthdays': {
    team: 'e.g. Joey, Ibby, Michael',
    what: "e.g. Pizza Night, Andrew's Birthday Dinner",
  },
  'orban-making': {
    team: 'e.g. David, Anne',
    what: 'e.g. Orban baking for Sunday liturgy',
  },
  'cleaning': {
    team: 'e.g. Daniel, Manuela, Sarah',
    what: 'e.g. Hall deep clean, Kitchen and bathrooms tidy',
  },
  'uncle-gamal-juice': {
    team: 'e.g. Uncle Gamal',
    what: 'e.g. Fresh juice for Sunday youth',
  },
};

const DEFAULT_PLACEHOLDERS = {
  team: 'e.g. Names of everyone involved',
  what: 'e.g. Describe the activity',
};

export function AddEntryForm({ service, onSuccess }: AddEntryFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ date: '', team: '', what: '' });
  const [savedDate, setSavedDate] = useState<string | null>(null);

  const placeholders = SERVICE_PLACEHOLDERS[service.id] ?? DEFAULT_PLACEHOLDERS;

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.date) errs.date = 'Date is required';
    if (!form.team.trim()) errs.team = 'Team / who is required';
    if (!form.what.trim()) errs.what = 'Activity description is required';
    if (form.what.length > WHAT_MAX) errs.what = `Max ${WHAT_MAX} characters`;
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: service.id,
          date: form.date,
          team: form.team,
          what: form.what,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        setErrors({ submit: data.error || 'Something went wrong. Please try again.' });
        return;
      }

      setSavedDate(form.date);
      setForm({ date: '', team: '', what: '' });
      router.refresh();
      onSuccess?.();
    } catch {
      setErrors({ submit: 'Network error. Please check your connection.' });
    } finally {
      setLoading(false);
    }
  }

  const whatLen = form.what.length;
  const nearLimit = whatLen >= WHAT_MAX * 0.85;
  const atLimit = whatLen >= WHAT_MAX;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Date"
        type="date"
        lang="en-GB"
        required
        value={form.date}
        onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
        error={errors.date}
      />
      <Input
        label="Team / Who"
        placeholder={placeholders.team}
        required
        value={form.team}
        onChange={(e) => setForm((f) => ({ ...f, team: e.target.value }))}
        error={errors.team}
        helperText="Names of everyone involved"
      />

      {/* What field with character counter */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-stone-700">
          What <span className="ml-1 text-rose-500">*</span>
        </label>
        <textarea
          placeholder={placeholders.what}
          required
          rows={3}
          maxLength={WHAT_MAX}
          value={form.what}
          onChange={(e) => setForm((f) => ({ ...f, what: e.target.value }))}
          className={[
            'w-full rounded-xl border bg-white px-4 py-3 text-stone-900 placeholder:text-stone-400',
            'transition-all duration-200 outline-none resize-none',
            'focus:ring-2',
            errors.what
              ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-100'
              : 'border-stone-200 focus:border-amber-400 focus:ring-amber-100',
          ].join(' ')}
        />
        <div className="flex items-center justify-between">
          {errors.what ? (
            <p className="text-xs text-rose-600 flex items-center gap-1">
              <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              {errors.what}
            </p>
          ) : (
            <p className="text-xs text-stone-400">Describe the activity</p>
          )}
          <span className={`text-xs font-medium tabular-nums ${atLimit ? 'text-rose-600' : nearLimit ? 'text-amber-600' : 'text-stone-400'}`}>
            {whatLen}/{WHAT_MAX}
          </span>
        </div>
      </div>

      {errors.submit && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
          {errors.submit}
        </div>
      )}

      <Button type="submit" isLoading={loading} className="w-full">
        Save Entry
      </Button>

      {savedDate && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 leading-relaxed">
          ✅ Entry saved! You will receive a reminder email <strong>5 days before</strong> on{' '}
          <strong>{new Date(savedDate + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>.
          Please check your <strong>inbox and spam folder</strong> around that time.
        </div>
      )}
    </form>
  );
}

      </Button>

      {savedDate && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 leading-relaxed">
          ✅ Entry saved! You will receive a reminder email <strong>5 days before</strong> on{' '}
          <strong>{new Date(savedDate + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>.
          Please check your <strong>inbox and spam folder</strong> around that time.
        </div>
      )}
    </form>
  );
}
