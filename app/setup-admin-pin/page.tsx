'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';

type Status = 'loading' | 'invalid' | 'ready' | 'success';

export default function SetupAdminPinPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') ?? '';

  const [status, setStatus] = useState<Status>('loading');
  const [adminName, setAdminName] = useState('');
  const [pin, setPin] = useState(['', '', '', '']);
  const [confirm, setConfirm] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!token) { setStatus('invalid'); return; }
    fetch(`/api/setup-admin-pin?token=${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then(d => {
        if (d.valid) { setAdminName(d.name); setStatus('ready'); }
        else setStatus('invalid');
      })
      .catch(() => setStatus('invalid'));
  }, [token]);

  function handleDigit(
    idx: number,
    value: string,
    state: string[],
    setState: (v: string[]) => void,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
    nextGroup?: () => void,
  ) {
    if (!/^\d?$/.test(value)) return;
    const next = [...state];
    next[idx] = value;
    setState(next);
    if (value && idx < 3) refs.current[idx + 1]?.focus();
    if (value && idx === 3) nextGroup?.();
  }

  function handleKeyDown(
    idx: number,
    e: React.KeyboardEvent,
    state: string[],
    setState: (v: string[]) => void,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
  ) {
    if (e.key === 'Backspace' && !state[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const pinStr = pin.join('');
    const confirmStr = confirm.join('');
    if (pinStr.length !== 4) { setError('Please enter all 4 digits of your PIN.'); return; }
    if (pinStr !== confirmStr) { setError('PINs don\'t match. Please try again.'); setConfirm(['', '', '', '']); confirmRefs.current[0]?.focus(); return; }

    setSaving(true);
    const res = await fetch('/api/setup-admin-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, pin: pinStr }),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) { setError(data.error ?? 'Something went wrong.'); return; }
    setStatus('success');
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-stone-50 flex items-center justify-center">
        <p className="text-stone-400 text-sm">Verifying your link…</p>
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-stone-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-8 max-w-sm w-full text-center">
          <p className="text-4xl mb-4">⛔</p>
          <h1 className="text-lg font-bold text-stone-900 mb-2">Link expired or invalid</h1>
          <p className="text-sm text-stone-500">This setup link has expired or has already been used. Ask the admin to resend the invite.</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-stone-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-8 max-w-sm w-full text-center">
          <p className="text-4xl mb-4">🎉</p>
          <h1 className="text-lg font-bold text-stone-900 mb-2">PIN set!</h1>
          <p className="text-sm text-stone-500 mb-6">Your admin PIN has been saved. You can now sign in to the admin panel.</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-6 py-2.5 rounded-xl transition-colors"
          >
            Go to login →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image src="/st-wanas-icon.png" alt="St Wanas" width={80} height={80} className="rounded-full object-cover shadow-md bg-amber-50" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900">Set Your Admin PIN</h1>
          <p className="text-stone-500 mt-1 text-sm">Hi {adminName} 👋 — choose a 4-digit PIN to secure your admin access.</p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-3">Choose a PIN</label>
              <div className="flex gap-3 justify-center">
                {pin.map((d, i) => (
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el; }}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={e => handleDigit(i, e.target.value, pin, setPin, inputRefs, () => confirmRefs.current[0]?.focus())}
                    onKeyDown={e => handleKeyDown(i, e, pin, setPin, inputRefs)}
                    className="w-12 h-14 text-center text-xl font-bold border-2 border-stone-200 rounded-xl focus:border-amber-400 focus:outline-none transition-colors"
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-3">Confirm PIN</label>
              <div className="flex gap-3 justify-center">
                {confirm.map((d, i) => (
                  <input
                    key={i}
                    ref={el => { confirmRefs.current[i] = el; }}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={e => handleDigit(i, e.target.value, confirm, setConfirm, confirmRefs)}
                    onKeyDown={e => handleKeyDown(i, e, confirm, setConfirm, confirmRefs)}
                    className="w-12 h-14 text-center text-xl font-bold border-2 border-stone-200 rounded-xl focus:border-amber-400 focus:outline-none transition-colors"
                  />
                ))}
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="bg-amber-500 hover:bg-amber-600 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Set PIN & Activate Admin Access'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
