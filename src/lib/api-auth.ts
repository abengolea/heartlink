import { getAuth } from 'firebase-admin/auth';
import { getUserByEmail } from '@/lib/firestore';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin-v4';
import type { User } from '@/lib/types';

export interface AuthenticatedUser {
  firebaseUid: string;
  email: string;
  dbUser: User;
}

/**
 * Obtiene el usuario autenticado desde el token Bearer en el header Authorization.
 * Retorna null si no hay token o es inválido.
 */
export async function getAuthenticatedUser(request: Request): Promise<AuthenticatedUser | null> {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    if (!token) return null;

    const app = initializeFirebaseAdmin();
    const auth = getAuth(app);
    const decodedToken = await auth.verifyIdToken(token);

    const email = decodedToken.email;
    if (!email) return null;

    const dbUser = await getUserByEmail(email);
    if (!dbUser) return null;

    return {
      firebaseUid: decodedToken.uid,
      email,
      dbUser,
    };
  } catch {
    return null;
  }
}

/**
 * Verifica que el usuario esté autenticado. Retorna el usuario o lanza error para 401.
 */
export async function requireAuth(request: Request): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}

/**
 * Verifica que el usuario esté autenticado y tenga uno de los roles permitidos.
 */
export async function requireRole(
  request: Request,
  allowedRoles: User['role'][]
): Promise<AuthenticatedUser> {
  const user = await requireAuth(request);
  if (!allowedRoles.includes(user.dbUser.role)) {
    throw new Error('FORBIDDEN');
  }
  return user;
}
