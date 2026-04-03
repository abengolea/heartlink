import { getAuth } from 'firebase-admin/auth';
import { getUserByEmail } from '@/lib/firestore';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin-v4';
import { getCookieValue, SESSION_COOKIE_NAME } from '@/lib/auth-session-cookie';
import type { User } from '@/lib/types';

export interface AuthenticatedUser {
  firebaseUid: string;
  email: string;
  dbUser: User;
}

async function userFromDecoded(uid: string, email: string | undefined): Promise<AuthenticatedUser | null> {
  if (!email) return null;
  const dbUser = await getUserByEmail(email);
  if (!dbUser) return null;
  return { firebaseUid: uid, email, dbUser };
}

/**
 * Obtiene el usuario autenticado desde Authorization: Bearer (ID token)
 * o desde la cookie de sesión httpOnly (login vía backend).
 */
export async function getAuthenticatedUser(request: Request): Promise<AuthenticatedUser | null> {
  const app = initializeFirebaseAdmin();
  const auth = getAuth(app);

  try {
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      if (token) {
        const decodedToken = await auth.verifyIdToken(token);
        return userFromDecoded(decodedToken.uid, decodedToken.email);
      }
    }
  } catch {
    /* intentar cookie */
  }

  try {
    const rawCookie = request.headers.get('cookie');
    const sessionCookie = getCookieValue(rawCookie, SESSION_COOKIE_NAME);
    if (sessionCookie) {
      const decoded = await auth.verifySessionCookie(sessionCookie, true);
      return userFromDecoded(decoded.uid, decoded.email);
    }
  } catch {
    return null;
  }

  return null;
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
