import { NextRequest, NextResponse } from 'next/server';
import { updateSubscription, updateUser } from '@/lib/firestore';
import { getFirestoreAdmin } from '@/lib/firebase-admin-v4';
import { getFirestore } from 'firebase-admin/firestore';
import { requireRole } from '@/lib/api-auth';

function getDb() {
  return getFirestore(getFirestoreAdmin());
}

/**
 * PATCH: Actualizar suscripción (admin) - desbloquear, extender, etc.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(request, ['admin']);
    const { id } = await params;
    const db = getDb();
    const subDoc = await db.collection('subscriptions').doc(id).get();
    if (!subDoc.exists) {
      return NextResponse.json({ error: 'Suscripción no encontrada' }, { status: 404 });
    }
    const sub = subDoc.data() as { userId?: string };
    const userId = sub?.userId;

    const body = await request.json();

    const updates: Record<string, unknown> = {};
    if (typeof body.isAccessBlocked === 'boolean') updates.isAccessBlocked = body.isAccessBlocked;
    if (typeof body.status === 'string') updates.status = body.status;
    if (body.endDate) updates.endDate = body.endDate;
    if (body.gracePeriodEndDate) updates.gracePeriodEndDate = body.gracePeriodEndDate;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 });
    }

    await updateSubscription(id, updates);

    if (userId) {
      if (body.isAccessBlocked === false) {
        await updateUser(userId, { subscriptionStatus: 'active' });
      }
      if (body.isAccessBlocked === true) {
        await updateUser(userId, { subscriptionStatus: 'suspended' });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '';
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    if (msg === 'FORBIDDEN') return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    console.error('❌ [Admin Subscriptions API] Error:', error);
    return NextResponse.json(
      { error: 'Error al actualizar suscripción' },
      { status: 500 }
    );
  }
}
