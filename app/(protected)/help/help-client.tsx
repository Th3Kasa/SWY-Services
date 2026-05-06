'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  LogIn,
  LayoutDashboard,
  Plus,
  Bell,
  Pencil,
  CalendarDays,
  Sparkles,
  HelpCircle,
  HeartHandshake,
} from 'lucide-react';

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

const STEPS = [
  {
    n: 1,
    icon: LogIn,
    title: 'Sign in (no password!)',
    body: 'Enter your first name, last name, and email — that\'s it, no password needed. We use your email to send you reminders, nothing else.',
    color: '#dbeafe',
    accent: 'text-blue-700',
  },
  {
    n: 2,
    icon: LayoutDashboard,
    title: 'Pick a service',
    body: 'You\'ll see all 7 youth services on the Dashboard — Monthly Outings, Friday Cooking, Cleaning, Uncle Gamal\'s Juice, and more. Tap whichever one you want to help with.',
    color: '#ede9fe',
    accent: 'text-violet-700',
  },
  {
    n: 3,
    icon: Plus,
    title: 'Add your entry',
    body: 'Tap "Add Entry", pick a date, list who\'s on the team with you, and a quick note about what you\'re doing. Save and you\'re all set!',
    color: '#dcfce7',
    accent: 'text-green-700',
  },
  {
    n: 4,
    icon: Bell,
    title: 'Get a reminder',
    body: 'Five days before your service, we\'ll email you and the service leader to make sure everyone\'s prepared. Please check your inbox and spam folder — reminder emails can sometimes land in spam.',
    color: '#fce7f3',
    accent: 'text-rose-700',
  },
  {
    n: 5,
    icon: Pencil,
    title: 'Edit or delete anytime',
    body: 'On the "My Entries" page you can change the date, team, or details — or remove an entry if your plans change. You can only edit your own entries.',
    color: '#fef9c3',
    accent: 'text-yellow-700',
  },
  {
    n: 6,
    icon: CalendarDays,
    title: 'See the full calendar',
    body: 'The Calendar tab shows every service across the year, so you can see what\'s coming up and avoid clashing dates.',
    color: '#cffafe',
    accent: 'text-cyan-700',
  },
];

const FAQS = [
  {
    q: 'Do I need to sign up or create an account?',
    a: 'No — there\'s no signup form and no password. Just enter your first name, last name, and email. The first time, we save you automatically. Next time, type the same details and you\'re right back in.',
  },
  {
    q: 'Can two people sign in with the same email?',
    a: 'No. Each email is tied to one person. If your email is already used, you\'ll see a helpful message — just use your own email.',
  },
  {
    q: 'What if I made a mistake on an entry?',
    a: 'Open "My Entries" or the service page, find your entry, and tap the pencil icon to edit, or the trash icon to delete it. You can only edit entries you submitted.',
  },
  {
    q: 'Will the leader know if I\'m running a service?',
    a: 'Yes — five days before, both you and the service leader get an email reminder so they can follow up if needed.',
  },
  {
    q: 'I\'m stuck — who can help?',
    a: 'Speak to Basem and he\'ll sort you out.',
  },
];

export function HelpClient() {
  return (
    <div className="max-w-3xl mx-auto">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="text-center mb-8 sm:mb-10"
      >
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 mb-4">
          <HelpCircle className="h-3.5 w-3.5" />
          QUICK GUIDE
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 mb-3">
          How it works
        </h1>
        <p className="text-stone-500 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
          A simple way to organise our youth services together.{' '}
          <span className="font-semibold text-stone-700">No paperwork. No spreadsheets.</span>{' '}
          Just six easy steps.
        </p>
      </motion.div>

      {/* Bible verse */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5 text-center"
      >
        <p className="text-base sm:text-lg font-semibold text-amber-900 leading-relaxed mb-2">
          &ldquo;As each one has received a gift, minister it to one another, as good stewards of the manifold grace of God.&rdquo;
        </p>
        <p className="text-sm text-amber-700 font-medium">— 1 Peter 4:10</p>
      </motion.div>

      {/* Steps */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-4 mb-10"
      >
        {STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.n}
              variants={itemVariants}
              className="rounded-2xl border-2 border-amber-200 p-5 shadow-sm"
              style={{ backgroundColor: step.color }}
            >
              <div className="flex items-start gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ${step.accent}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-xs font-bold text-stone-400">STEP {step.n}</span>
                  </div>
                  <h3 className="font-bold text-stone-900 text-base sm:text-lg leading-tight mb-1.5">
                    {step.title}
                  </h3>
                  <p className="text-sm text-stone-700 leading-relaxed">
                    {step.body}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* CTA banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 p-6 sm:p-8 text-center shadow-lg mb-10"
      >
        <div className="text-4xl mb-3">
          <HeartHandshake className="h-10 w-10 text-white inline-block" strokeWidth={1.5} />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
          Ready to serve?
        </h2>
        <p className="text-amber-50 text-sm sm:text-base mb-5 max-w-md mx-auto leading-relaxed">
          Every hand makes a difference. Pick a service, add yourself, and let&apos;s build something beautiful together.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-amber-700 shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
        >
          <Sparkles className="h-4 w-4" />
          See the services
        </Link>
      </motion.div>

      {/* FAQ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <h2 className="text-xl sm:text-2xl font-bold text-stone-900 mb-4">
          Common questions
        </h2>
        <div className="flex flex-col gap-3">
          {FAQS.map((faq, i) => (
            <details
              key={i}
              className="group rounded-2xl border border-stone-200 bg-white p-4 sm:p-5 shadow-sm open:shadow-md transition-shadow"
            >
              <summary className="flex items-center justify-between cursor-pointer list-none gap-3">
                <span className="font-semibold text-stone-900 text-sm sm:text-base">
                  {faq.q}
                </span>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-lg font-bold group-open:rotate-45 transition-transform">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm text-stone-600 leading-relaxed">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </motion.div>

      {/* Footer note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.8 }}
        className="text-center text-sm text-stone-400 mt-10 mb-4"
      >
        Still stuck? Speak to{' '}
        <span className="font-semibold text-stone-600">Basem</span> — he&apos;s happy to help. 🙌
      </motion.p>
    </div>
  );
}
