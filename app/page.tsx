import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';

// Root "/" redirects to the appropriate place
export default function RootPage() {
  const user = getAuthUser();
  if (user) {
    redirect('/dashboard');
  }
  redirect('/login');
}
