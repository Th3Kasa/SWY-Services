'use client';

import { useEffect } from 'react';

// Session guard: marks this tab as active and clears the session when the
// tab/window is closed. The server-side cookie (session-scoped, no maxAge)
// is the real auth gate — this just cleans up on tab close via sendBeacon.
export function SessionGuard() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Mark this tab as having an active session.
    sessionStorage.setItem('swy_session', '1');

    // When the tab/window is closed (pagehide without bfcache), log out.
    const handlePageHide = (e: PageTransitionEvent) => {
      if (!e.persisted) {
        navigator.sendBeacon('/api/logout');
      }
    };

    window.addEventListener('pagehide', handlePageHide);
    return () => window.removeEventListener('pagehide', handlePageHide);
  }, []);

  return null;
}
