import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { requireRole } from '@/lib/api-auth';
import { getUserById } from '@/lib/firestore';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin-v4';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000';

/**
 * POST: Reenvía el email de invitación a un médico solicitante.
 * Admin puede reenviar a cualquiera. Operador puede reenviar a cualquier solicitante.
 * Si el usuario no existe en Firebase Auth (ej. creado solo en Firestore), se crea y se envía el email.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requesterId: string }> }
) {
  try {
    const auth = await requireRole(request, [
      'admin',
      'operator',
    ]);
    const { requesterId } = await params;

    const user = await getUserById(requesterId);
    if (!user) {
      return NextResponse.json(
        { error: 'Médico no encontrado' },
        { status: 404 }
      );
    }

    const email = (user.email || '').trim();
    if (!email) {
      return NextResponse.json(
        { error: 'El médico no tiene email registrado' },
        { status: 400 }
      );
    }

    const app = initializeFirebaseAdmin();
    const firebaseAuth = getAuth(app);
    const db = getFirestore(app);

    // Si no existe en Firebase Auth, crear cuenta (médicos creados solo en Firestore)
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
      console.log('✅ [ResendInvite] Usuario creado en Auth para:', email);
    }

    const operatorName = auth.dbUser.name || 'Un médico operador';
    const emailSubject = `${operatorName} - Reenvío de invitación a HeartLink`;

    const resetLink = await firebaseAuth.generatePasswordResetLink(email, {
      url: `${APP_URL}`,
    });

    await db.collection('mail').add({
      to: email,
      message: {
        subject: emailSubject,
        html: `
          <h2>Reenvío de invitación a HeartLink</h2>
          <p><strong>${operatorName}</strong> te reenvía el enlace para activar tu cuenta.</p>
          <p>Haz clic para generar o restablecer tu contraseña:</p>
          <p><a href="${resetLink}" style="background:#2563eb;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;">Generar mi contraseña</a></p>
          <p style="word-break:break-all;color:#666;font-size:12px;">${resetLink}</p>
          <p>El enlace expira en 24 horas.</p>
          <p>Saludos,<br/>Equipo HeartLink</p>
        `,
      },
    });

    console.log('✅ [ResendInvite] Email encolado para:', email);

    return NextResponse.json({
      success: true,
      message: `Email de invitación reenviado a ${email}. Revisa la bandeja de entrada y spam.`,
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
    console.error('Error resend-invite:', error);
    return NextResponse.json(
      { error: 'Error al reenviar email' },
      { status: 500 }
    );
  }
}
