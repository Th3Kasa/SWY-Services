'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import ReCAPTCHA from 'react-google-recaptcha';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', pin: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  // Check if the entered email belongs to an admin (to show PIN field)
  useEffect(() => {
    const email = form.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setIsAdmin(false); return; }
    let cancelled = false;
    fetch(`/api/check-admin?email=${encodeURIComponent(email)}`)
      .then(r => r.json())
      .then(d => { if (!cancelled) setIsAdmin(d.isAdmin === true); })
      .catch(() => { if (!cancelled) setIsAdmin(false); });
    return () => { cancelled = true; };
  }, [form.email]);

  // Show reCAPTCHA only when all fields are fully valid
  const nameValid = (() => {
    const parts = form.name.trim().split(/\s+/).filter(Boolean);
    return parts.length >= 2 && parts.every((p) => p.length >= 2);
  })();
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const pinValid = !isAdmin || form.pin.trim().length > 0;
  const showCaptcha = nameValid && emailValid && pinValid;

  function validate() {
    const errs: Record<string, string> = {};
    const trimmed = form.name.trim();
    if (!trimmed) {
      errs.name = 'Full name is required';
    } else {
      const parts = trimmed.split(/\s+/).filter(Boolean);
      if (parts.length < 2) {
        errs.name = 'Please enter both your first and last name';
      } else if (parts.some((p) => p.length < 2)) {
        errs.name = 'Each name should be at least 2 letters';
      }
    }
    if (!form.email.trim()) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Please enter a valid email address';
    }
    if (isAdmin && !form.pin.trim()) {
      errs.pin = 'Please enter your Admin PIN';
    }
    return errs;
  }

  function validateField(field: 'name' | 'email' | 'pin') {
    const errs = validate();
    setErrors((prev) => ({ ...prev, [field]: errs[field] ?? '' }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    if (!captchaToken) {
      setErrors({ submit: 'Please complete the reCAPTCHA check below before signing in.' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          captchaToken,
          ...(isAdmin && { pin: form.pin }),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data.error || 'Something went wrong. Please try again.';
        const isPinError = res.status === 403;
        setErrors(isPinError ? { pin: msg } : { submit: msg });
        recaptchaRef.current?.reset();
        setCaptchaToken(null);
        return;
      }

      sessionStorage.setItem('swy_session', '1');
      router.push('/');
      router.refresh();
    } catch {
      setErrors({ submit: 'Network error. Please check your connection.' });
      recaptchaRef.current?.reset();
      setCaptchaToken(null);
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
              onChange={(e) => {
                setForm((f) => ({ ...f, name: e.target.value }));
                if (errors.name) setErrors((p) => ({ ...p, name: '' }));
              }}
              onBlur={() => validateField('name')}
              error={errors.name}
              helperText="First and last name, please"
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
              value={form.email}
              onChange={(e) => {
                setForm((f) => ({ ...f, email: e.target.value }));
                if (errors.email) setErrors((p) => ({ ...p, email: '' }));
              }}
              onBlur={() => validateField('email')}
              error={errors.email}
            />
            {isAdmin && nameValid && emailValid && (
              <Input
                label="Admin PIN"
                type="password"
                placeholder="Enter your PIN"
                required
                autoComplete="current-password"
                value={form.pin}
                onChange={(e) => {
                  setForm((f) => ({ ...f, pin: e.target.value }));
                  if (errors.pin) setErrors((prev) => ({ ...prev, pin: '' }));
                }}
                onBlur={() => validateField('pin')}
                error={errors.pin}
              />
            )}

            {errors.submit && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
                {errors.submit}
              </div>
            )}

            <Button
              type="submit"
              isLoading={loading}
              size="lg"
              className="w-full mt-1"
              disabled={loading}
            >
              Sign In
            </Button>
          </form>

          <p className="text-center text-xs text-stone-400 mt-4 leading-relaxed">
            No password needed. Your name and email identify you.
          </p>
          <p className="text-center text-xs text-stone-400 mt-2 leading-relaxed">
            Having trouble? Speak to <span className="font-semibold text-stone-500">Basem</span> for help.
          </p>

          {/* Bottom section — QR code fades out, reCAPTCHA fades in */}
          <div className="mt-6 pt-5 border-t border-stone-100 flex flex-col items-center gap-3">
            <AnimatePresence mode="wait">
              {showCaptcha ? (
                <motion.div
                  key="captcha"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col items-center gap-3 w-full"
                >
                  <p className="text-xs text-stone-500 text-center font-medium">
                    One last step — prove you&apos;re human 👇
                  </p>
                  <div className="flex justify-center">
                    <ReCAPTCHA
                      ref={recaptchaRef}
                      sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
                      onChange={(token) => setCaptchaToken(token)}
                      onExpired={() => setCaptchaToken(null)}
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="qrcode"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col items-center gap-3"
                >
                  <p className="text-xs text-stone-500 text-center font-medium">
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
