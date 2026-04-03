import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin-v4';
import { sanitizeFirebaseEnvString } from '@/lib/sanitize-firebase-env';
import {
  isSecureCookieRuntime,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_MS,
  SESSION_MAX_AGE_SEC,
} from '@/lib/auth-session-cookie';

/**
 * Login vía backend: verifica credenciales con Identity Toolkit (servidor)
 * y crea sesión con cookie httpOnly (createSessionCookie); el cliente no llama a Firebase Auth.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // FIREBASE_API_KEY (runtime) tiene prioridad; fallback a NEXT_PUBLIC_* (build)
    const apiKey =
      sanitizeFirebaseEnvString(process.env.FIREBASE_API_KEY) ||
      sanitizeFirebaseEnvString(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
    if (!apiKey) {
      console.error('❌ [Login Backend] FIREBASE_API_KEY o NEXT_PUBLIC_FIREBASE_API_KEY no configurada/vacía');
      return NextResponse.json(
        { error: 'Configuración del servidor incompleta' },
        { status: 500 }
      );
    }

    // Verificar credenciales vía REST API (el servidor SÍ puede alcanzar Google)
    const toolkitRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          returnSecureToken: true,
        }),
      }
    );

    const data = await toolkitRes.json();

    if (!toolkitRes.ok) {
      const errorCode = data?.error?.message || 'unknown';
      const errorMsg = data?.error?.message || data?.error || 'Error de autenticación';
      console.warn('❌ [Login Backend] Auth failed:', errorCode);
      return NextResponse.json(
        { error: errorMsg },
        { status: 401 }
      );
    }

    const idToken = data.idToken as string | undefined;
    if (!idToken) {
      return NextResponse.json(
        { error: 'Respuesta inválida de Firebase (sin idToken)' },
        { status: 500 }
      );
    }

    const app = initializeFirebaseAdmin();
    const auth = getAuth(app);
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: isSecureCookieRuntime(),
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SEC,
    });
    return response;
  } catch (err) {
    console.error('❌ [Login Backend] Error:', err);
    return NextResponse.json(
      {
        error: 'Error al iniciar sesión',
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
