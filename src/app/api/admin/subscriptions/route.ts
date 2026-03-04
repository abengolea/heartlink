import { NextRequest, NextResponse } from 'next/server';
import { getAllSubscriptions } from '@/lib/firestore';
import { requireRole } from '@/lib/api-auth';

/**
 * GET: Lista todas las suscripciones (admin)
 */
export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['admin']);
    const subscriptions = await getAllSubscriptions();
    return NextResponse.json(subscriptions);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '';
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    if (msg === 'FORBIDDEN') return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    console.error('❌ [Admin Subscriptions API] Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener suscripciones' },
      { status: 500 }
    );
  }
}
