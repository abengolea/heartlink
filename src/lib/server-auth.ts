import { headers } from 'next/headers';
import { getAuthenticatedUser } from '@/lib/api-auth';
import type { AuthenticatedUser } from '@/lib/api-auth';

/**
 * Usuario autenticado en Server Components (cookie de sesión o igual que en Route Handlers).
 */
export async function getServerAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const h = await headers();
  const cookie = h.get('cookie');
  if (!cookie) return null;
  return getAuthenticatedUser(new Request('http://localhost', { headers: { cookie } }));
}
