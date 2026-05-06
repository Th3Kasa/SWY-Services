'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Users, FileText, ArrowRight, Pencil, Trash2, Check, X } from 'lucide-react';
import { ServiceEntry } from '@/lib/supabase';
import { getServiceById } from '@/lib/services';
import { formatDate, isUpcoming } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface MyEntriesClientProps {
  entries: ServiceEntry[];
  userName: string;
  userEmail: string;
}

export function MyEntriesClient({ entries, userName, userEmail }: MyEntriesClientProps) {
  const upcoming = entries.filter((e) => isUpcoming(e.date));
  const past = entries.filter((e) => !isUpcoming(e.date)).reverse();

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="mb-6"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-900">My Entries</h1>
        <p className="text-stone-500 mt-1 text-sm">
          Entries you created or are part of, {userName}.
        </p>
      </motion.div>

      {entries.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl border-2 border-dashed border-stone-200 p-12 text-center"
        >
          <div className="text-5xl mb-3">📋</div>
          <h2 className="text-lg font-semibold text-stone-700 mb-1">No entries yet</h2>
          <p className="text-stone-400 text-sm mb-4">
            Once you add entries to a service, they'll appear here.
          </p>
          <Link href="/dashboard">
            <Button variant="outline">Browse Services</Button>
          </Link>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-8">
          {upcoming.length > 0 && (
            <EntriesSection title="Upcoming" entries={upcoming} userEmail={userEmail} />
          )}
          {past.length > 0 && (
            <EntriesSection title="Past" entries={past} userEmail={userEmail} muted />
          )}
        </div>
      )}
    </div>
  );
}

function EntriesSection({
  title,
  entries,
  userEmail,
  muted = false,
}: {
  title: string;
  entries: ServiceEntry[];
  userEmail: string;
  muted?: boolean;
}) {
  return (
    <div>
      <h2 className={`text-sm font-semibold uppercase tracking-wide mb-3 ${muted ? 'text-stone-400' : 'text-stone-500'}`}>
        {title}
      </h2>
      <motion.ul
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
        className="flex flex-col gap-3"
      >
        <AnimatePresence>
          {entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} userEmail={userEmail} muted={muted} />
          ))}
        </AnimatePresence>
      </motion.ul>
    </div>
  );
}

function EntryCard({
  entry,
  userEmail,
  muted,
}: {
  entry: ServiceEntry;
  userEmail: string;
  muted: boolean;
}) {
  const router = useRouter();
  const service = getServiceById(entry.service_id);
  const isOwner = entry.created_by_email === userEmail;

  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [editForm, setEditForm] = useState({ date: entry.date, team: entry.team, what: entry.what });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    if (!editForm.date || !editForm.team.trim() || !editForm.what.trim()) {
      setError('All fields are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/entries/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || 'Failed to save.');
        return;
      }
      setMode('view');
      router.refresh();
    } catch {
      setError('Network error.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError('');
    try {
      const res = await fetch(`/api/entries/${entry.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || 'Failed to delete.');
        setDeleting(false);
        setConfirmDelete(false);
        return;
      }
      router.refresh();
    } catch {
      setError('Network error.');
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <motion.li
      layout
      variants={{
        hidden: { opacity: 0, y: 12 },
        show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
      }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className={`rounded-2xl border bg-white p-4 shadow-card ${muted && mode === 'view' ? 'opacity-60' : ''}`}
    >
      {mode === 'view' ? (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            {service && (
              <div className="flex items-center gap-2 mb-2">
                <span>{service.iconEmoji}</span>
                <span className={`text-xs font-medium ${service.textColorClass} ${service.badgeBgClass} rounded-full px-2 py-0.5`}>
                  {service.name}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1.5 mb-1.5 text-sm text-stone-600">
              <Calendar className="h-3.5 w-3.5 text-stone-400" />
              <span className="font-medium">{formatDate(entry.date)}</span>
            </div>
            <div className="flex items-start gap-1.5 mb-1">
              <FileText className="h-3.5 w-3.5 mt-0.5 text-stone-400 shrink-0" />
              <p className="text-sm font-semibold text-stone-900">{entry.what}</p>
            </div>
            <div className="flex items-start gap-1.5">
              <Users className="h-3.5 w-3.5 mt-0.5 text-stone-400 shrink-0" />
              <p className="text-sm text-stone-600">{entry.team}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isOwner && !confirmDelete && (
              <>
                <button
                  onClick={() => { setMode('edit'); setEditForm({ date: entry.date, team: entry.team, what: entry.what }); setError(''); }}
                  className="p-2 rounded-xl text-stone-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                  title="Edit entry"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Delete entry"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
            {isOwner && confirmDelete && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-500">Delete?</span>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-3 py-1.5 rounded-xl bg-rose-500 text-white text-xs font-medium hover:bg-rose-600 transition-colors disabled:opacity-60"
                >
                  {deleting ? '...' : 'Yes'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 rounded-xl bg-stone-100 text-stone-700 text-xs font-medium hover:bg-stone-200 transition-colors"
                >
                  No
                </button>
              </div>
            )}
            {!isOwner && service && (
              <Link href={`/services/${service.id}`} className="shrink-0">
                <Button variant="ghost" size="sm" className="gap-1 text-stone-500">
                  View <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      ) : (
        /* Edit mode */
        <div className="flex flex-col gap-3">
          {service && (
            <div className="flex items-center gap-2 mb-1">
              <span>{service.iconEmoji}</span>
              <span className={`text-xs font-medium ${service.textColorClass} ${service.badgeBgClass} rounded-full px-2 py-0.5`}>
                {service.name}
              </span>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <div>
              <label className="text-xs font-medium text-stone-500 mb-1 block">Date</label>
              <input
                type="date"
                lang="en-GB"
                value={editForm.date}
                onChange={(e) => setEditForm(f => ({ ...f, date: e.target.value }))}
                className="h-9 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-500 mb-1 block">Team / Who</label>
              <input
                type="text"
                value={editForm.team}
                onChange={(e) => setEditForm(f => ({ ...f, team: e.target.value }))}
                className="h-9 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-500 mb-1 block">What</label>
              <textarea
                rows={2}
                value={editForm.what}
                onChange={(e) => setEditForm(f => ({ ...f, what: e.target.value }))}
                className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none resize-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
              />
            </div>
          </div>
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setMode('view'); setError(''); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 text-stone-700 text-sm font-medium hover:bg-stone-200 transition-colors"
            >
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-60"
            >
              <Check className="h-3.5 w-3.5" /> {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </motion.li>
  );
}
