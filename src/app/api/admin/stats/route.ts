import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import {
  getAllUsers,
  getAllPatients,
  getAllStudies,
  getAllSubscriptions,
} from '@/lib/firestore';
import { getNotificasHubDb } from '@/lib/notificashub';

export interface AdminStats {
  subscribers: number;
  paying: number;
  whatsappMessagesSent: number | null;
  whatsappAvgPerOperator: number | null;
  whatsappOperatorsWithSends: number | null;
  whatsappEstimatedCost: number | null;
  patients: number;
  studies: number;
  users: number;
  operators: number;
  solicitantes: number;
  medicosSolicitantes: number;
  admins: number;
  totalPaymentsApproved: number;
  revenue: number;
}

/**
 * GET: Estadísticas globales del sistema (solo admin).
 */
export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['admin']);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '';
    if (msg === 'UNAUTHORIZED')
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    if (msg === 'FORBIDDEN')
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    throw error;
  }

  try {
    const [users, patients, studies, subscriptions] = await Promise.all([
      getAllUsers(),
      getAllPatients(),
      getAllStudies(),
      getAllSubscriptions(),
    ]);

    const subscribers = subscriptions.length;
    const paying = subscriptions.filter((s) => s.status === 'active').length;

    // Usuarios por rol
    const operators = users.filter(
      (u) => u.role === 'operator' || u.role === 'admin'
    ).length;
    const solicitantes = users.filter((u) => u.role === 'solicitante').length;
    const medicosSolicitantes = users.filter(
      (u) => u.role === 'medico_solicitante'
    ).length;
    const admins = users.filter((u) => u.role === 'admin').length;

    // Pagos aprobados y revenue
    let totalPaymentsApproved = 0;
    let revenue = 0;
    for (const sub of subscriptions) {
      const history = sub.paymentHistory || [];
      for (const p of history) {
        if (p.status === 'approved') {
          totalPaymentsApproved += 1;
          revenue += p.amount ?? 0;
        }
      }
    }

    // Mensajes WhatsApp enviados y estadísticas por operador (NotificasHub)
    let whatsappMessagesSent: number | null = null;
    let whatsappAvgPerOperator: number | null = null;
    let whatsappOperatorsWithSends: number | null = null;
    let whatsappEstimatedCost: number | null = null;

    try {
      const hubDb = getNotificasHubDb();
      const sendsSnapshot = await hubDb
        .collection('sends')
        .where('appId', '==', 'heartlink')
        .get();
      whatsappMessagesSent = sendsSnapshot.size;

      if (sendsSnapshot.size > 0) {
        const byOperator = new Map<string, number>();
        sendsSnapshot.docs.forEach((doc) => {
          const operatorId = doc.data().operatorId;
          if (operatorId) {
            byOperator.set(operatorId, (byOperator.get(operatorId) || 0) + 1);
          }
        });
        whatsappOperatorsWithSends = byOperator.size;
        const messagesWithOperator = Array.from(byOperator.values()).reduce((a, b) => a + b, 0);
        whatsappAvgPerOperator =
          byOperator.size > 0
            ? Math.round((messagesWithOperator / byOperator.size) * 10) / 10
            : 0;

        const costPerMsg = process.env.WHATSAPP_ESTIMATED_COST_PER_MESSAGE_ARS;
        if (costPerMsg && !Number.isNaN(Number(costPerMsg))) {
          whatsappEstimatedCost = sendsSnapshot.size * Number(costPerMsg);
        }
      }
    } catch (hubErr) {
      console.warn('[admin/stats] NotificasHub no disponible:', hubErr);
    }

    const stats: AdminStats = {
      subscribers,
      paying,
      whatsappMessagesSent,
      whatsappAvgPerOperator,
      whatsappOperatorsWithSends,
      whatsappEstimatedCost,
      patients: patients.length,
      studies: studies.length,
      users: users.length,
      operators,
      solicitantes,
      medicosSolicitantes,
      admins,
      totalPaymentsApproved,
      revenue,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('[admin/stats] Error:', error);
    return NextResponse.json(
      { error: 'Error al cargar estadísticas' },
      { status: 500 }
    );
  }
}
