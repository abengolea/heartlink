import { NextResponse } from 'next/server';
import { isSecureCookieRuntime, SESSION_COOKIE_NAME } from '@/lib/auth-session-cookie';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: isSecureCookieRuntime(),
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}
