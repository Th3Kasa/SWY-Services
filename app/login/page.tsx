'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Full name is required';
    if (!form.email.trim()) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Please enter a valid email address';
    }
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
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), email: form.email.trim().toLowerCase() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrors({ submit: data.error || 'Something went wrong. Please try again.' });
        return;
      }

      router.push('/');
      router.refresh();
    } catch {
      setErrors({ submit: 'Network error. Please check your connection.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-stone-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
            className="flex justify-center mb-4"
          >
            <Image
              src="/st-wanas-icon.png"
              alt="St Wanas"
              width={96}
              height={96}
              className="rounded-full object-cover shadow-md bg-amber-50"
            />
          </motion.div>
          <h1 className="text-2xl font-bold text-stone-900">St Wanas Youth Services</h1>
          <p className="text-stone-500 mt-1 text-sm">Youth Group Scheduling</p>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: 'easeOut' }}
          className="rounded-2xl bg-white shadow-soft border border-stone-100 p-6"
        >
          <h2 className="text-lg font-bold text-stone-900 mb-1">Welcome back 👋</h2>
          <p className="text-sm text-stone-500 mb-5">
            Enter your name and email to sign in.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <Input
              label="Full Name"
              placeholder="e.g. John Smith"
              required
              autoComplete="name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              error={errors.name}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              error={errors.email}
            />

            {errors.submit && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
                {errors.submit}
              </div>
            )}

            <Button type="submit" isLoading={loading} size="lg" className="w-full mt-1">
              Sign In
            </Button>
          </form>

          <p className="text-center text-xs text-stone-400 mt-4 leading-relaxed">
            No password needed. Your name and email identify you.
          </p>
          <p className="text-center text-xs text-stone-400 mt-2 leading-relaxed">
            Having trouble? Speak to <span className="font-semibold text-stone-500">Basem</span> for help.
          </p>

          {/* QR code — for screen-share onboarding */}
          <div className="mt-6 pt-5 border-t border-stone-100 flex flex-col items-center">
            <p className="text-xs text-stone-500 mb-3 text-center font-medium">
              📱 Scan to open on your phone
            </p>
            <div className="rounded-2xl bg-white border-2 border-amber-200 p-3 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=0&data=https%3A%2F%2Fswy-services.vercel.app%2F"
                alt="Scan to open swy-services.vercel.app"
                width={180}
                height={180}
                className="block"
              />
            </div>
            <p className="text-[11px] text-stone-400 mt-2 font-mono">swy-services.vercel.app</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
