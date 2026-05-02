import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const ADMIN_EMAIL = 'basemmorkos98@gmail.com';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = getAuthUser();

  if (!user || user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    redirect('/login');
  }

  return <>{children}</>;
}
