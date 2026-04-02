import { NextRequest, NextResponse } from 'next/server';
import { getSubscriptionByUserId, checkUserAccess } from '@/lib/firestore';
import { getAuthenticatedUser } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    const isOwn = authUser.dbUser.id === userId;
    const isAdmin = authUser.dbUser.role === 'admin';
    if (!isOwn && !isAdmin) {
      return NextResponse.json({ error: 'No autorizado para consultar esta suscripción' }, { status: 403 });
    }

    console.log('📊 [Subscription Status API] Checking status for user:', userId);

    const [subscription, accessCheck] = await Promise.all([
      getSubscriptionByUserId(userId),
      checkUserAccess(userId),
    ]);

    const trialSendsRemaining =
      accessCheck.reason === 'trial_sends' ? accessCheck.trialSendsRemaining : undefined;

    if (!accessCheck.hasAccess) {
      let statusMessage = '';
      let statusColor = 'red';

      switch (accessCheck.reason) {
        case 'access_blocked':
          statusMessage = 'Tu acceso ha sido bloqueado por falta de pago';
          break;
        case 'subscription_inactive':
          statusMessage = 'Tu suscripción no está activa';
          break;
        case 'expired':
          statusMessage = 'Tu suscripción ha vencido y el período de gracia ha terminado';
          break;
        case 'no_subscription':
          statusMessage = 'No tienes una suscripción activa ni envíos de prueba disponibles';
          break;
        default:
          statusMessage = 'No tienes acceso a la plataforma';
      }

      const subPayload = subscription
        ? {
            id: subscription.id,
            status: subscription.status,
            planType: subscription.planType,
            amount: subscription.amount,
            currency: subscription.currency,
            startDate: subscription.startDate,
            endDate: subscription.endDate,
            nextBillingDate: subscription.nextBillingDate,
            lastPaymentDate: subscription.lastPaymentDate,
            isAccessBlocked: subscription.isAccessBlocked,
            daysRemaining: Math.ceil(
              (new Date(subscription.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            ),
            paymentHistory: subscription.paymentHistory || [],
          }
        : null;

      return NextResponse.json({
        hasSubscription: !!subscription,
        hasAccess: false,
        subscription: subPayload,
        trialSendsRemaining,
        accessInfo: {
          reason: accessCheck.reason,
          message: statusMessage,
          color: statusColor,
        },
        daysRemaining: subPayload?.daysRemaining ?? 0,
        statusMessage,
        shouldShowWarning: false,
        status: subscription?.status ?? '',
      });
    }

    const now = new Date();
    const endDate = subscription ? new Date(subscription.endDate) : null;
    const daysRemaining = endDate
      ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    let statusMessage = '';
    let statusColor = 'green';

    if (accessCheck.reason === 'trial_sends') {
      const left = accessCheck.trialSendsRemaining ?? 0;
      statusMessage =
        left === 1
          ? 'Modo prueba: te queda 1 envío gratis al médico por WhatsApp. Contratá un plan para enviar sin límite.'
          : `Modo prueba: te quedan ${left} envíos gratis al médico por WhatsApp. Contratá un plan para seguir sin límite.`;
      statusColor = 'blue';
    } else if (accessCheck.reason === 'grace_period') {
      statusMessage = `Tu suscripción venció pero tienes ${Math.max(0, daysRemaining + 10)} días de gracia restantes`;
      statusColor = 'orange';
    } else {
      statusMessage =
        daysRemaining > 0
          ? `Tu suscripción está activa. Vence en ${daysRemaining} días`
          : 'Tu suscripción está activa';
      statusColor = 'green';
    }

    console.log('📊 [Subscription Status API] Status calculated:', {
      userId,
      hasAccess: accessCheck.hasAccess,
      status: subscription?.status,
      daysRemaining,
      reason: accessCheck.reason,
    });

    const subPayload = subscription
      ? {
          id: subscription.id,
          status: subscription.status,
          planType: subscription.planType,
          amount: subscription.amount,
          currency: subscription.currency,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          nextBillingDate: subscription.nextBillingDate,
          lastPaymentDate: subscription.lastPaymentDate,
          isAccessBlocked: subscription.isAccessBlocked,
          daysRemaining,
          paymentHistory: subscription.paymentHistory || [],
        }
      : null;

    return NextResponse.json({
      hasSubscription: !!subscription,
      hasAccess: true,
      subscription: subPayload,
      trialSendsRemaining,
      accessInfo: {
        reason: accessCheck.reason,
        message: statusMessage,
        color: statusColor,
      },
      daysRemaining,
      statusMessage,
      shouldShowWarning: accessCheck.reason === 'grace_period',
      status: subscription?.status ?? '',
    });
  } catch (error) {
    console.error('❌ [Subscription Status API] Error getting subscription status:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription status' },
      { status: 500 }
    );
  }
}
