import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import { Nav } from '@/components/nav';

export const dynamic = 'force-dynamic';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = getAuthUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Nav userName={user.name} userEmail={user.email} />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">{children}</main>
    </div>
  );
}
