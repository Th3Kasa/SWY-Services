'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { ServiceEntry } from '@/lib/supabase';
import { ServiceConfig } from '@/lib/services';

interface CalendarClientProps {
  entries: ServiceEntry[];
  services: ServiceConfig[];
  submitterNames: Record<string, string>;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarClient({ entries, services, submitterNames }: CalendarClientProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed

  const serviceMap = useMemo(() => {
    const m: Record<string, ServiceConfig> = {};
    for (const s of services) m[s.id] = s;
    return m;
  }, [services]);

  // Group entries by date string YYYY-MM-DD
  const entriesByDate = useMemo(() => {
    const map: Record<string, ServiceEntry[]> = {};
    for (const e of entries) {
      const d = e.date.slice(0, 10);
      if (!map[d]) map[d] = [];
      map[d].push(e);
    }
    return map;
  }, [entries]);

  // Entries for the current month (for the list below)
  const monthEntries = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    return entries.filter((e) => e.date.startsWith(prefix));
  }, [entries, year, month]);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const todayStr = today.toISOString().split('T')[0];

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="mb-6"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-900">Service Calendar</h1>
        <p className="text-stone-500 mt-1 text-sm sm:text-base">
          All St Wanas Youth service entries at a glance.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05, ease: 'easeOut' }}
        className="rounded-2xl bg-white border border-stone-100 shadow-sm overflow-hidden"
      >
        {/* Month nav */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-stone-100">
          <button
            onClick={prevMonth}
            className="p-2 rounded-xl hover:bg-stone-100 transition-colors text-stone-600"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-bold text-stone-900">
            {MONTHS[month]} {year}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 rounded-xl hover:bg-stone-100 transition-colors text-stone-600"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-stone-100">
          {DAYS.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-stone-400 uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            if (!day) return <div key={i} className="min-h-[72px] border-b border-r border-stone-50" />;

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEntries = entriesByDate[dateStr] ?? [];
            const isToday = dateStr === todayStr;

            return (
              <div
                key={i}
                className={`min-h-[72px] p-1.5 border-b border-r border-stone-50 ${
                  isToday ? 'bg-amber-50' : 'bg-white'
                }`}
              >
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold mb-1 ${
                    isToday
                      ? 'bg-amber-500 text-white'
                      : 'text-stone-600'
                  }`}
                >
                  {day}
                </span>
                <div className="flex flex-col gap-0.5">
                  {dayEntries.slice(0, 3).map((e) => {
                    const svc = serviceMap[e.service_id];
                    return (
                      <div
                        key={e.id}
                        title={`${svc?.name ?? e.service_id}: ${e.what} (${e.team})`}
                        className={`truncate rounded px-1 py-0.5 text-[10px] font-medium leading-tight ${svc?.badgeBgClass ?? 'bg-stone-100'} ${svc?.textColorClass ?? 'text-stone-700'}`}
                      >
                        {svc?.iconEmoji} {e.what}
                      </div>
                    );
                  })}
                  {dayEntries.length > 3 && (
                    <span className="text-[10px] text-stone-400 pl-1">+{dayEntries.length - 3} more</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Month entries list */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.12, ease: 'easeOut' }}
        className="mt-6"
      >
        <h3 className="text-base font-bold text-stone-800 mb-3 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-amber-500" />
          {MONTHS[month]} entries
          <span className="ml-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5">
            {monthEntries.length}
          </span>
        </h3>

        {monthEntries.length === 0 ? (
          <div className="rounded-2xl bg-white border border-stone-100 p-8 text-center text-stone-400 text-sm">
            No services scheduled this month yet.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {monthEntries.map((e, idx) => {
              const svc = serviceMap[e.service_id];
              const date = new Date(e.date + 'T00:00:00');
              return (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: idx * 0.04 }}
                  className="flex items-start gap-3 rounded-2xl bg-white border border-stone-100 p-4 shadow-sm"
                >
                  <div className={`mt-0.5 h-10 w-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${svc?.badgeBgClass ?? 'bg-stone-100'}`}>
                    {svc?.iconEmoji ?? '📋'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-stone-900 text-sm">{svc?.name ?? e.service_id}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${svc?.badgeBgClass ?? 'bg-stone-100'} ${svc?.textColorClass ?? 'text-stone-600'}`}>
                        {date.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <p className="text-sm text-stone-700 mt-0.5 font-medium">{e.what}</p>
                    <p className="text-xs text-stone-500 mt-0.5 truncate">👥 {e.team}</p>
                    <p className="text-xs text-stone-400 mt-1">Posted by {submitterNames[e.created_by_email] ?? 'Unknown'}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
