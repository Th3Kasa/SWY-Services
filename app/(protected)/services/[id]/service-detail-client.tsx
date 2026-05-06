'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ArrowLeft, Calendar, Users, FileText, Clock, Pencil, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { AddEntryForm } from '@/components/add-entry-form';
import { Badge } from '@/components/ui/badge';
import { ServiceConfig } from '@/lib/services';
import { ServiceEntry } from '@/lib/supabase';
import { formatDate, isUpcoming } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface ServiceDetailClientProps {
  service: ServiceConfig;
  initialEntries: ServiceEntry[];
  submitterNames: Record<string, string>;
  userEmail: string;
}

export function ServiceDetailClient({ service, initialEntries, submitterNames, userEmail }: ServiceDetailClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();

  const upcoming = initialEntries.filter((e) => isUpcoming(e.date));
  const past = initialEntries.filter((e) => !isUpcoming(e.date)).reverse();

  function handleSuccess() {
    setModalOpen(false);
    router.refresh();
  }

  return (
    <div>
      {/* Back */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-4"
      >
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6"
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">{service.iconEmoji}</span>
            <h1 className="text-2xl font-bold text-stone-900">{service.name}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-stone-500">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {service.leader}
            </span>
            <Badge className="bg-amber-100 text-amber-700 border-0">
              {service.frequency}
            </Badge>
          </div>
        </div>

        <Button onClick={() => setModalOpen(true)} size="lg" className="shrink-0 gap-2">
          <Plus className="h-4 w-4" />
          Add Entry
        </Button>
      </motion.div>

      {/* Divider with color */}
      <div className={`h-1 rounded-full ${service.colorClass} mb-6 opacity-60`} />

      {/* Bible verse */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-center"
      >
        <p className="text-sm sm:text-base font-semibold text-amber-900 leading-relaxed mb-1">
          &ldquo;{service.verse.text}&rdquo;
        </p>
        <p className="text-xs text-amber-700 font-medium">— {service.verse.ref}</p>
      </motion.div>

      {/* Upcoming entries */}
      <Section
        title="Upcoming"
        entries={upcoming}
        service={service}
        userEmail={userEmail}
        submitterNames={submitterNames}
        emptyText="No upcoming entries yet. Add one!"
      />

      {/* Past entries */}
      {past.length > 0 && (
        <div className="mt-8">
          <Section
            title="Past"
            entries={past}
            service={service}
            userEmail={userEmail}
            submitterNames={submitterNames}
            emptyText=""
            muted
          />
        </div>
      )}

      {/* Add entry modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`Add Entry — ${service.name}`}>
        <AddEntryForm service={service} onSuccess={handleSuccess} />
      </Modal>
    </div>
  );
}

function Section({
  title, entries, service, userEmail, submitterNames, emptyText, muted = false,
}: {
  title: string;
  entries: ServiceEntry[];
  service: ServiceConfig;
  userEmail: string;
  submitterNames: Record<string, string>;
  emptyText: string;
  muted?: boolean;
}) {
  return (
    <div>
      <h2 className={`text-sm font-semibold uppercase tracking-wide mb-3 ${muted ? 'text-stone-400' : 'text-stone-500'}`}>
        {title}
      </h2>

      {entries.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-stone-200 p-8 text-center">
          <p className="text-stone-400 text-sm">{emptyText}</p>
        </div>
      ) : (
        <motion.ul
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
          className="flex flex-col gap-3"
        >
          <AnimatePresence>
            {entries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} service={service} userEmail={userEmail} submitterName={submitterNames[entry.created_by_email]} muted={muted} />
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
    </div>
  );
}

function EntryCard({
  entry, service, userEmail, submitterName, muted,
}: {
  entry: ServiceEntry;
  service: ServiceConfig;
  userEmail: string;
  submitterName: string | undefined;
  muted: boolean;
}) {
  const router = useRouter();
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
        hidden: { opacity: 0, x: -16 },
        show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } },
      }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className={`rounded-2xl border bg-white p-4 shadow-card ${muted && mode === 'view' ? 'opacity-60' : ''}`}
    >
      {mode === 'view' ? (
        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
          {/* Date pill */}
          <div className={`flex items-center gap-1.5 shrink-0 rounded-xl px-3 py-1.5 ${service.badgeBgClass}`}>
            <Calendar className={`h-3.5 w-3.5 ${service.textColorClass}`} />
            <span className={`text-xs font-semibold ${service.textColorClass}`}>
              {formatDate(entry.date)}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-1.5 mb-1.5">
              <FileText className="h-3.5 w-3.5 mt-0.5 text-stone-400 shrink-0" />
              <p className="text-sm font-semibold text-stone-900">{entry.what}</p>
            </div>
            <div className="flex items-start gap-1.5 mb-1">
              <Users className="h-3.5 w-3.5 mt-0.5 text-stone-400 shrink-0" />
              <p className="text-sm text-stone-600">{entry.team}</p>
            </div>
            <div className="flex items-center gap-1.5 ml-0.5">
              <span className="text-xs text-stone-400">Posted by</span>
              <span className="text-xs font-medium text-stone-500">
                {submitterName ?? entry.created_by_email}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <div className="flex items-center gap-1 text-xs text-stone-400 mr-1">
              <Clock className="h-3 w-3" />
              <span>{entry.created_at.slice(8, 10)}/{entry.created_at.slice(5, 7)}/{entry.created_at.slice(0, 4)}</span>
            </div>
            {isOwner && !confirmDelete && (
              <>
                <button
                  onClick={() => { setMode('edit'); setEditForm({ date: entry.date, team: entry.team, what: entry.what }); setError(''); }}
                  className="p-1.5 rounded-xl text-stone-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                  title="Edit"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="p-1.5 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
            {isOwner && confirmDelete && (
              <div className="flex items-center gap-1.5 ml-1">
                <span className="text-xs text-stone-500">Delete?</span>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-2.5 py-1 rounded-lg bg-rose-500 text-white text-xs font-medium hover:bg-rose-600 transition-colors disabled:opacity-60"
                >
                  {deleting ? '…' : 'Yes'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 text-xs font-medium hover:bg-stone-200 transition-colors"
                >
                  No
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Edit mode */
        <div className="flex flex-col gap-3">
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
