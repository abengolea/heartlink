import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { requireRole } from '@/lib/api-auth';
import { getUserById } from '@/lib/firestore';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin-v4';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000';

/**
 * POST: Envía un email al usuario con un enlace para configurar su contraseña.
 * Solo admin. Usado para médicos operadores y otros usuarios.
 * Devuelve el resetLink para que el admin pueda copiarlo y enviarlo por WhatsApp si lo desea.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(request, ['admin']);
    const { id: userId } = await params;

    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const email = (user.email || '').trim();
    if (!email) {
      return NextResponse.json(
        { error: 'El usuario no tiene email registrado' },
        { status: 400 }
      );
    }

    const app = initializeFirebaseAdmin();
    const firebaseAuth = getAuth(app);
    const db = getFirestore(app);

    // Si no existe en Firebase Auth, crear cuenta
    let authUserExists = true;
    try {
      await firebaseAuth.getUserByEmail(email);
    } catch {
      authUserExists = false;
    }

    if (!authUserExists) {
      const tempPassword = `Temp${Date.now()}${Math.random().toString(36).slice(2)}!`;
      await firebaseAuth.createUser({
        email,
        password: tempPassword,
        displayName: user.name || '',
        emailVerified: false,
      });
      console.log('✅ [SendPasswordLink] Usuario creado en Auth para:', email);
    }

    const adminName = auth.dbUser.name || 'Administrador';
    const emailSubject = `HeartLink - Configura tu contraseña`;

    const resetLink = await firebaseAuth.generatePasswordResetLink(email, {
      url: `${APP_URL}`,
    });

    await db.collection('mail').add({
      to: email,
      message: {
        subject: emailSubject,
        html: `
          <h2>Configura tu contraseña en HeartLink</h2>
          <p><strong>${adminName}</strong> te invita a configurar tu contraseña para acceder a HeartLink.</p>
          <p>Haz clic en el botón para crear o restablecer tu contraseña:</p>
          <p><a href="${resetLink}" style="background:#2563eb;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;">Configurar mi contraseña</a></p>
          <p style="word-break:break-all;color:#666;font-size:12px;">${resetLink}</p>
          <p>El enlace expira en 24 horas.</p>
          <p>Saludos,<br/>Equipo HeartLink</p>
        `,
      },
    });

    console.log('✅ [SendPasswordLink] Email encolado para:', email);

    return NextResponse.json({
      success: true,
      message: `Enlace enviado a ${email}. También podés copiarlo para enviarlo por WhatsApp.`,
      resetLink,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      }
      if (error.message === 'FORBIDDEN') {
        return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
      }
    }
    console.error('Error send-password-link:', error);
    return NextResponse.json(
      { error: 'Error al enviar el enlace' },
      { status: 500 }
    );
  }
}
