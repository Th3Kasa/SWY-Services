'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { ServiceConfig } from '@/lib/services';

interface AddEntryFormProps {
  service: ServiceConfig;
  onSuccess?: () => void;
}

export function AddEntryForm({ service, onSuccess }: AddEntryFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ date: '', team: '', what: '' });

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.date) errs.date = 'Date is required';
    if (!form.team.trim()) errs.team = 'Team / who is required';
    if (!form.what.trim()) errs.what = 'Activity description is required';
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

      setForm({ date: '', team: '', what: '' });
      router.refresh();
      onSuccess?.();
    } catch {
      setErrors({ submit: 'Network error. Please check your connection.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Date"
        type="date"
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
      <Textarea
        label="What"
        placeholder="e.g. Church Sleepover"
        required
        value={form.what}
        onChange={(e) => setForm((f) => ({ ...f, what: e.target.value }))}
        error={errors.what}
        helperText="Describe the activity"
      />

      {errors.submit && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
          {errors.submit}
        </div>
      )}

      <Button type="submit" isLoading={loading} className="w-full">
        Save Entry
      </Button>
    </form>
  );
}
