import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { requireRole } from '@/lib/api-auth';
import {
  getUserByEmail,
  getSolicitanteByPhone,
  createUser,
  addDoctorToOperator,
  getUserById,
} from '@/lib/firestore';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin-v4';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4000';

/**
 * POST: Invita a un médico solicitante.
 * - Solo teléfono: crea registro mínimo (nombre "Por completar"), el médico completa después en la app.
 * - Datos completos: crea cuenta Firebase Auth + Firestore, envía email para contraseña.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, [
      'admin',
      'operator',
    ]);
    const body = await request.json();
    const { name, email, phone, specialty } = body;

    const phoneDigits = (phone || '').toString().replace(/\D/g, '');
    const phoneNormalized = phoneDigits.length >= 10
      ? (phoneDigits.startsWith('54') ? phoneDigits : `54${phoneDigits}`)
      : '';

    // Flujo rápido: solo teléfono (el médico completa después en la app)
    if (phoneNormalized && (!email || !email.trim())) {
      const existing = await getSolicitanteByPhone(phoneNormalized);
      if (existing) {
        return NextResponse.json(
          { error: 'Ya existe un médico solicitante con este teléfono', userId: existing.id },
          { status: 409 }
        );
      }
      const dbUserId = await createUser({
        name: (name && String(name).trim()) || 'Por completar',
        phone: phoneNormalized,
        role: 'solicitante',
        status: 'active',
        specialty: specialty || undefined,
      });
      const operatorId =
        body.operatorId ||
        (auth.dbUser.role === 'operator' ? auth.dbUser.id : null);
      if (operatorId) {
        await addDoctorToOperator(operatorId, dbUserId);
      }
      return NextResponse.json({
        success: true,
        message: 'Solicitante creado. El médico puede completar su perfil en la app.',
        userId: dbUserId,
      });
    }

    // Flujo completo: email + todos los datos
    if (!name || !email || !phone || !specialty) {
      return NextResponse.json(
        { error: 'Faltan campos: name, email, phone, specialty (o solo phone para crear rápido)' },
        { status: 400 }
      );
    }

    const operatorId =
      body.operatorId ||
      (auth.dbUser.role === 'operator'
        ? auth.dbUser.id
        : null);

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con este email' },
        { status: 409 }
      );
    }

    const app = initializeFirebaseAdmin();
    const firebaseAuth = getAuth(app);

    // Verificar si ya existe en Firebase Auth
    try {
      await firebaseAuth.getUserByEmail(email);
      return NextResponse.json(
        { error: 'Ya existe una cuenta con este email' },
        { status: 409 }
      );
    } catch {
      // No existe, continuar
    }

    // Crear en Firebase Auth con contraseña temporal (nunca se usa)
    const tempPassword = `Temp${Date.now()}${Math.random().toString(36).slice(2)}!`;
    await firebaseAuth.createUser({
      email,
      password: tempPassword,
      displayName: name,
      emailVerified: false,
    });

    // Crear en Firestore
    const dbUserId = await createUser({
      name: name.trim(),
      email,
      phone,
      specialty,
      role: 'solicitante',
      status: 'active',
    });

    // Vincular al operador si hay uno
    if (operatorId) {
      await addDoctorToOperator(operatorId, dbUserId);
    }

    const operator = operatorId ? await getUserById(operatorId) : null;
    const operatorName = operator?.name || 'Un médico operador';
    const emailSubject = operatorName
      ? `${operatorName} te incorporó a su red de médicos solicitantes`
      : 'Bienvenido a HeartLink - Activa tu cuenta';

    // Generar link para crear contraseña (Firebase password reset)
    const resetLink = await firebaseAuth.generatePasswordResetLink(email, {
      url: `${APP_URL}`,
    });

    // Enviar email vía Firebase Trigger Email (colección mail)
    try {
      const db = getFirestore(app);
      await db.collection('mail').add({
        to: email,
        message: {
          subject: emailSubject,
          html: `
            <h2>¡Bienvenido a HeartLink!</h2>
            <p>${operatorName ? `<strong>${operatorName}</strong> te ha incorporado a su red de médicos solicitantes.` : 'Has sido registrado en HeartLink.'}</p>
            <p>Para activar tu cuenta y generar tu contraseña, haz clic en el siguiente enlace:</p>
            <p><a href="${resetLink}" style="background:#2563eb;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;">Generar mi contraseña</a></p>
            <p>O copia este enlace en tu navegador:</p>
            <p style="word-break:break-all;color:#666;">${resetLink}</p>
            <p>El enlace expira en 24 horas.</p>
            <p>Saludos,<br/>Equipo HeartLink</p>
          `,
        },
      });
      console.log('✅ [Invite] Email añadido a cola mail para:', email);
    } catch (emailError) {
      console.error('Error añadiendo email a cola:', emailError);
    }

    return NextResponse.json({
      success: true,
      message:
        'Solicitante creado. Se envió un email para que genere su contraseña.',
      userId: dbUserId,
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
    console.error('Error invitando solicitante:', error);
    return NextResponse.json(
      { error: 'Error al invitar solicitante' },
      { status: 500 }
    );
  }
}
