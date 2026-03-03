import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin-v4';

/** Genera una contraseña segura (12 caracteres, letras y números) */
function generateSecurePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'; // Sin I,O,0,1 para evitar confusión
  const buf = randomBytes(12);
  let pass = '';
  for (let i = 0; i < 12; i++) {
    pass += chars[buf[i] % chars.length];
  }
  return pass;
}

/**
 * POST: Solicita restablecimiento de contraseña.
 * Genera una nueva contraseña, la actualiza en Firebase Auth y envía un email
 * con la contraseña vía Firestore Trigger Email (Gmail SMTP).
 */
export async function POST(request: NextRequest) {
  console.log('🔑 [Reset API] Processing password reset request...');

  try {
    const { email } = await request.json();
    const emailTrimmed = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!emailTrimmed) {
      return NextResponse.json({ error: 'Email es requerido' }, { status: 400 });
    }

    const app = initializeFirebaseAdmin();
    const auth = getAuth(app);

    let firebaseUser;
    try {
      firebaseUser = await auth.getUserByEmail(emailTrimmed);
    } catch {
      // No revelar si el usuario existe o no (seguridad)
      console.log('❌ [Reset API] User not found in Firebase Auth');
      return NextResponse.json({
        success: true,
        message: 'Si el email existe en nuestro sistema, recibirás un correo con tu nueva contraseña.',
      });
    }

    const newPassword = generateSecurePassword();

    try {
      await auth.updateUser(firebaseUser.uid, { password: newPassword });
      console.log('✅ [Reset API] Password updated for:', firebaseUser.uid);
    } catch (updateError: any) {
      console.error('❌ [Reset API] Error updating password:', updateError);
      return NextResponse.json(
        { error: 'No se pudo actualizar la contraseña. Intenta más tarde.' },
        { status: 500 }
      );
    }

    // Enviar email vía Firestore Trigger Email (colección mail → Gmail SMTP)
    try {
      const db = getFirestore(app);
      await db.collection('mail').add({
        to: emailTrimmed,
        message: {
          subject: 'HeartLink - Tu nueva contraseña',
          html: `
            <h2>Recuperación de contraseña</h2>
            <p>Has solicitado restablecer tu contraseña en HeartLink.</p>
            <p><strong>Tu nueva contraseña es:</strong></p>
            <p style="font-size:18px;font-family:monospace;background:#f3f4f6;padding:12px 20px;border-radius:8px;letter-spacing:2px;">${newPassword}</p>
            <p>Copia esta contraseña y úsala para iniciar sesión. Puedes cambiarla después en la configuración de tu cuenta.</p>
            <p>Si no solicitaste este cambio, ignora este correo y usa tu contraseña actual.</p>
            <p>Saludos,<br/>Equipo HeartLink</p>
          `,
        },
      });
      console.log('✅ [Reset API] Email encolado para:', emailTrimmed);
    } catch (emailError) {
      console.error('❌ [Reset API] Error encolando email:', emailError);
      // La contraseña ya se actualizó; informar al usuario que revise o intente de nuevo
      return NextResponse.json(
        {
          error: 'La contraseña se actualizó pero no pudimos enviar el email. Contacta al administrador.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Se ha enviado tu nueva contraseña a tu correo electrónico.',
    });
  } catch (error) {
    console.error('❌ [Reset API] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Error interno. Intenta más tarde.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Password Reset Endpoint',
    usage: 'POST with { email }',
    description: 'Genera nueva contraseña y la envía por email',
  });
}
