'use client';

import { auth } from '@/lib/firebase-client';

/**
 * Fetch wrapper que añade automáticamente el token de Firebase al header Authorization.
 * Usar en componentes cliente para llamar a APIs protegidas.
 */
export async function fetchWithAuth(
  url: string | URL,
  options: RequestInit = {}
): Promise<Response> {
  const token = await auth.currentUser?.getIdToken();
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(url, {
    ...options,
    headers,
    credentials: options.credentials ?? 'same-origin',
  });
}
