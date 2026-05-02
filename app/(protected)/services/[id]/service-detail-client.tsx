'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ArrowLeft, Calendar, Users, FileText, Clock } from 'lucide-react';
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
}

export function ServiceDetailClient({ service, initialEntries }: ServiceDetailClientProps) {
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
            <Badge className={`${service.badgeBgClass} ${service.textColorClass} border-0`}>
              {service.frequency}
            </Badge>
          </div>
        </div>

        <Button
          onClick={() => setModalOpen(true)}
          size="lg"
          className="shrink-0 gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Entry
        </Button>
      </motion.div>

      {/* Divider with color */}
      <div className={`h-1 rounded-full ${service.colorClass} mb-6 opacity-60`} />

      {/* Upcoming entries */}
      <Section
        title="Upcoming"
        entries={upcoming}
        service={service}
        emptyText="No upcoming entries yet. Add one!"
      />

      {/* Past entries */}
      {past.length > 0 && (
        <div className="mt-8">
          <Section
            title="Past"
            entries={past}
            service={service}
            emptyText=""
            muted
          />
        </div>
      )}

      {/* Add entry modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Add Entry — ${service.name}`}
      >
        <AddEntryForm service={service} onSuccess={handleSuccess} />
      </Modal>
    </div>
  );
}

function Section({
  title,
  entries,
  service,
  emptyText,
  muted = false,
}: {
  title: string;
  entries: ServiceEntry[];
  service: ServiceConfig;
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
              <motion.li
                key={entry.id}
                variants={{
                  hidden: { opacity: 0, x: -16 },
                  show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } },
                }}
                className={`rounded-2xl border bg-white p-4 shadow-card ${muted ? 'opacity-60' : ''}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  {/* Date pill */}
                  <div className={`flex items-center gap-1.5 shrink-0 rounded-xl px-3 py-1.5 ${service.badgeBgClass}`}>
                    <Calendar className={`h-3.5 w-3.5 ${service.textColorClass}`} />
                    <span className={`text-xs font-semibold ${service.textColorClass}`}>
                      {formatDate(entry.date)}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* What */}
                    <div className="flex items-start gap-1.5 mb-1.5">
                      <FileText className="h-3.5 w-3.5 mt-0.5 text-stone-400 shrink-0" />
                      <p className="text-sm font-semibold text-stone-900">{entry.what}</p>
                    </div>
                    {/* Team */}
                    <div className="flex items-start gap-1.5">
                      <Users className="h-3.5 w-3.5 mt-0.5 text-stone-400 shrink-0" />
                      <p className="text-sm text-stone-600">{entry.team}</p>
                    </div>
                  </div>

                  {/* Added time */}
                  <div className="flex items-center gap-1 text-xs text-stone-400 shrink-0">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(entry.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</span>
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
    </div>
  );
}
