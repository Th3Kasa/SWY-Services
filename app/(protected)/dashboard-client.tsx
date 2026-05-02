'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ServiceConfig } from '@/lib/services';

interface DashboardClientProps {
  services: ServiceConfig[];
  counts: Record<string, number>;
}

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

export function DashboardClient({ services, counts }: DashboardClientProps) {
  return (
    <div>
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="mb-6 sm:mb-8"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-900">
          St Wanas Youth Services
        </h1>
        <p className="text-stone-500 mt-1 text-sm sm:text-base">
          All 7 recurring youth services. Tap a card to view and add entries.
        </p>
      </motion.div>

      {/* Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {services.map((service) => {
          const count = counts[service.id] ?? 0;

          return (
            <motion.div
              key={service.id}
              variants={cardVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <Card className={`h-full border-2 ${service.borderColorClass} overflow-hidden`} style={{ backgroundColor: service.cardBgColor }}>
                <CardContent className="pt-4 pb-4">
                  {/* Icon + name */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-2xl mb-1 block">{service.iconEmoji}</span>
                      <h2 className="font-bold text-stone-900 text-base leading-snug">
                        {service.name}
                      </h2>
                    </div>
                    <Badge
                      className={`${service.badgeBgClass} ${service.textColorClass} border-0 shrink-0 mt-1`}
                    >
                      {service.frequency}
                    </Badge>
                  </div>

                  {/* Leader */}
                  <div className="flex items-center gap-1.5 text-sm text-stone-600 mb-2">
                    <Users className="h-3.5 w-3.5 text-stone-400" />
                    <span>{service.leader}</span>
                  </div>

                  {/* Upcoming count */}
                  <div className="flex items-center gap-1.5 text-sm text-stone-600 mb-4">
                    <Calendar className="h-3.5 w-3.5 text-stone-400" />
                    <span>
                      {count === 0
                        ? 'No upcoming entries'
                        : `${count} upcoming ${count === 1 ? 'entry' : 'entries'}`}
                    </span>
                  </div>

                  {/* CTA */}
                  <Link href={`/services/${service.id}`}>
                    <Button variant="outline" size="sm" className="w-full group">
                      View / Add
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
