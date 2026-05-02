'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, Users, FileText, ArrowRight } from 'lucide-react';
import { ServiceEntry } from '@/lib/supabase';
import { getServiceById } from '@/lib/services';
import { formatDate, isUpcoming } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface MyEntriesClientProps {
  entries: ServiceEntry[];
  userName: string;
}

export function MyEntriesClient({ entries, userName }: MyEntriesClientProps) {
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
            <EntriesSection title="Upcoming" entries={upcoming} />
          )}
          {past.length > 0 && (
            <EntriesSection title="Past" entries={past} muted />
          )}
        </div>
      )}
    </div>
  );
}

function EntriesSection({
  title,
  entries,
  muted = false,
}: {
  title: string;
  entries: ServiceEntry[];
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
        {entries.map((entry) => {
          const service = getServiceById(entry.service_id);
          return (
            <motion.li
              key={entry.id}
              variants={{
                hidden: { opacity: 0, y: 12 },
                show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
              }}
              className={`rounded-2xl border bg-white p-4 shadow-card ${muted ? 'opacity-60' : ''}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  {/* Service name */}
                  {service && (
                    <div className="flex items-center gap-2 mb-2">
                      <span>{service.iconEmoji}</span>
                      <span className={`text-xs font-medium ${service.textColorClass} ${service.badgeBgClass} rounded-full px-2 py-0.5`}>
                        {service.name}
                      </span>
                    </div>
                  )}

                  {/* Date */}
                  <div className="flex items-center gap-1.5 mb-1.5 text-sm text-stone-600">
                    <Calendar className="h-3.5 w-3.5 text-stone-400" />
                    <span className="font-medium">{formatDate(entry.date)}</span>
                  </div>

                  {/* What */}
                  <div className="flex items-start gap-1.5 mb-1">
                    <FileText className="h-3.5 w-3.5 mt-0.5 text-stone-400 shrink-0" />
                    <p className="text-sm font-semibold text-stone-900">{entry.what}</p>
                  </div>

                  {/* Team */}
                  <div className="flex items-start gap-1.5">
                    <Users className="h-3.5 w-3.5 mt-0.5 text-stone-400 shrink-0" />
                    <p className="text-sm text-stone-600">{entry.team}</p>
                  </div>
                </div>

                {service && (
                  <Link href={`/services/${service.id}`} className="shrink-0">
                    <Button variant="ghost" size="sm" className="gap-1 text-stone-500">
                      View <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                )}
              </div>
            </motion.li>
          );
        })}
      </motion.ul>
    </div>
  );
}
