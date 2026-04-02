import { NextRequest, NextResponse } from 'next/server';
import { addOperatorTrialWhatsAppSends } from '@/lib/firestore';
import { requireRole } from '@/lib/api-auth';

/**
 * POST: suma envíos de prueba (WhatsApp al médico solicitante) a un operador.
 * Body: { userId: string, amount: number } — amount entero 1..500
 */
export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ['admin']);

    const body = await request.json();
    const userId = typeof body?.userId === 'string' ? body.userId.trim() : '';
    const amount = Number(body?.amount);

    if (!userId) {
      return NextResponse.json({ error: 'userId es obligatorio' }, { status: 400 });
    }

    try {
      const { previous, newTotal } = await addOperatorTrialWhatsAppSends(userId, amount);
      return NextResponse.json({
        success: true,
        previous,
        newTotal,
        added: newTotal - previous,
        message:
          newTotal - previous < amount
            ? `Se sumaron ${newTotal - previous} envíos (tope máximo acumulado alcanzado). Total: ${newTotal}.`
            : `Listo: ${previous} → ${newTotal} envíos de prueba.`,
      });
    } catch (err: unknown) {
      const code = err instanceof Error ? err.message : '';
      if (code === 'INVALID_AMOUNT') {
        return NextResponse.json(
          {
            error:
              'Cantidad inválida. Enviá un entero entre 1 y 500 (máximo por solicitud).',
          },
          { status: 400 }
        );
      }
      if (code === 'USER_NOT_FOUND') {
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
      }
      if (code === 'NOT_OPERATOR') {
        return NextResponse.json(
          { error: 'Solo los médicos operadores pueden recibir envíos de prueba.' },
          { status: 422 }
        );
      }
      throw err;
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '';
    if (msg === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    if (msg === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }
    console.error('[admin/operators/trial-sends]', error);
    return NextResponse.json({ error: 'Error al actualizar envíos de prueba' }, { status: 500 });
  }
}
