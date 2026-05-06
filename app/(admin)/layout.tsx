import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import { SessionGuard } from '@/components/session-guard';

export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = getAuthUser();

  if (!user || !user.isAdmin) {
    redirect('/login');
  }

  return (
    <>
      <SessionGuard />
      {children}
    </>
  );
}
