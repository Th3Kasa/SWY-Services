'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { LogOut, Menu, X, LayoutDashboard, BookOpen, CalendarDays, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

const ADMIN_EMAIL = 'basemmorkos98@gmail.com';

interface NavProps {
  userName: string;
  userEmail: string;
}

export function Nav({ userName, userEmail }: NavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSignOut() {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/calendar', label: 'Calendar', icon: CalendarDays },
    { href: '/my-entries', label: 'My Entries', icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold text-stone-900 hover:text-amber-600 transition-colors"
        >
          <Image src="/st-wanas-icon.png" alt="St Wanas" width={32} height={32} className="rounded-full object-cover bg-amber-50" />
          <span className="hidden sm:inline">St Wanas Youth</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                pathname === href
                  ? 'bg-amber-100 text-amber-700'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
          {userEmail.toLowerCase() === ADMIN_EMAIL && (
            <Link
              href="/admin"
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                pathname === '/admin'
                  ? 'bg-amber-100 text-amber-700'
                  : 'text-stone-400 hover:bg-stone-100 hover:text-stone-600'
              }`}
            >
              <Settings2 className="h-4 w-4" />
              Admin
            </Link>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-sm text-stone-600">
            👋 <span className="font-medium text-stone-800">{userName}</span>
          </span>
          <button
            onClick={handleSignOut}
            className="hidden sm:flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-stone-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>

          {/* Mobile menu toggle */}
          <button
            className="flex sm:hidden items-center justify-center rounded-xl p-2 text-stone-600 hover:bg-stone-100"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden border-t border-stone-100 bg-white sm:hidden"
          >
            <div className="flex flex-col gap-1 p-3">
              <div className="px-3 py-2 text-sm text-stone-500">
                👋 <span className="font-medium text-stone-800">{userName}</span>
              </div>
              {links.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    pathname === href
                      ? 'bg-amber-100 text-amber-700'
                      : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
              {userEmail.toLowerCase() === ADMIN_EMAIL && (
                <Link
                  href="/admin"
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    pathname === '/admin'
                      ? 'bg-amber-100 text-amber-700'
                      : 'text-stone-400 hover:bg-stone-100 hover:text-stone-600'
                  }`}
                >
                  <Settings2 className="h-4 w-4" />
                  Admin
                </Link>
              )}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-500 hover:bg-rose-50"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
