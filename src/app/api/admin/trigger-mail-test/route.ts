import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { requireRole } from '@/lib/api-auth';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin-v4';

/**
 * POST: Envía un email de prueba vía Firebase Trigger Email (colección mail).
 * Solo admin.
 */
export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ['admin']);

    const body = await request.json();
    const { to } = body;

    if (!to || typeof to !== 'string') {
      return NextResponse.json(
        { error: 'Campo "to" (email) requerido' },
        { status: 400 }
      );
    }

    const app = initializeFirebaseAdmin();
    const db = getFirestore(app);

    await db.collection('mail').add({
      to: to.trim(),
      message: {
        subject: 'HeartLink - Email de prueba (Trigger Mail)',
        html: `
          <h2>✅ Email de prueba</h2>
          <p>Si recibiste este correo, la extensión <strong>Firebase Trigger Email</strong> está funcionando correctamente.</p>
          <p>Enviado desde: <strong>HeartLink Admin</strong></p>
          <p style="color:#666;font-size:12px;">${new Date().toISOString()}</p>
        `,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Email de prueba encolado para ${to}. Revisa tu bandeja de entrada.`,
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
    console.error('Error en trigger-mail-test:', error);
    return NextResponse.json(
      { error: 'Error al encolar email' },
      { status: 500 }
    );
  }
}
