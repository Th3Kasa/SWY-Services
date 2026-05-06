'use client';

// SessionGuard is now a no-op. The session is enforced solely by the
// server-side cookie being session-scoped (no maxAge), which the browser
// automatically clears when the browser process is closed.
//
// Previous attempts to log out on tab close via pagehide+sendBeacon also
// fired on hard refresh, which caused spurious logouts during normal use.
export function SessionGuard() {
  return null;
}
