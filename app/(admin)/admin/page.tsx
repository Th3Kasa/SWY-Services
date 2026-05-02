import { getAuthUser } from '@/lib/auth';
import { AdminClient } from './admin-client';

export const dynamic = 'force-dynamic';

export default function AdminPage() {
  const user = getAuthUser()!;
  return <AdminClient adminName={user.name} />;
}
