/** Cookie httpOnly para sesión tras login vía servidor (sin SDK Auth en el cliente). */

export const SESSION_COOKIE_NAME = 'hl_session';

/** Debe coincidir con expiresIn de createSessionCookie (ms). */
export const SESSION_DURATION_MS = 5 * 24 * 60 * 60 * 1000;

export const SESSION_MAX_AGE_SEC = Math.floor(SESSION_DURATION_MS / 1000);

export function getCookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const i = part.indexOf('=');
    if (i === -1) continue;
    const key = part.slice(0, i).trim();
    if (key !== name) continue;
    return decodeURIComponent(part.slice(i + 1).trim());
  }
  return null;
}

export function isSecureCookieRuntime(): boolean {
  return process.env.NODE_ENV === 'production';
}
