'use client';

import { useEffect } from 'react';

// Per-tab session enforcement.
// sessionStorage is scoped to a single tab — closing the tab/window clears it.
// On mount, if the marker is missing, we log out and redirect to /login.
// The login page sets the marker on successful sign-in.
export function SessionGuard() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem('swy_session') === '1') return;

    // No active tab session — force logout and redirect.
    fetch('/api/logout', { method: 'POST' }).finally(() => {
      window.location.href = '/login';
    });
  }, []);

  return null;
}
