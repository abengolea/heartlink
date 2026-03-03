import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin-v4';

/**
 * Login vía backend: evita auth/network-request-failed cuando el navegador
 * no puede conectar directamente con identitytoolkit.googleapis.com.
 * El servidor hace la verificación y devuelve un custom token.
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
    const apiKey = process.env.FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      console.error('❌ [Login Backend] FIREBASE_API_KEY o NEXT_PUBLIC_FIREBASE_API_KEY no configurada/vacía');
      return NextResponse.json(
        { error: 'Configuración del servidor incompleta' },
        { status: 500 }
      );
    }

    // Verificar credenciales vía REST API (el servidor SÍ puede alcanzar Google)
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
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

    const data = await res.json();

    if (!res.ok) {
      const errorCode = data?.error?.message || 'unknown';
      const errorMsg = data?.error?.message || data?.error || 'Error de autenticación';
      console.warn('❌ [Login Backend] Auth failed:', errorCode);
      return NextResponse.json(
        { error: errorMsg },
        { status: 401 }
      );
    }

    const uid = data.localId;
    if (!uid) {
      return NextResponse.json(
        { error: 'Respuesta inválida de Firebase' },
        { status: 500 }
      );
    }

    // Crear custom token para que el cliente establezca la sesión
    const app = initializeFirebaseAdmin();
    const auth = getAuth(app);
    const customToken = await auth.createCustomToken(uid);

    return NextResponse.json({ customToken });
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
