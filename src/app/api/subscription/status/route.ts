import { NextRequest, NextResponse } from 'next/server';
import { getSubscriptionByUserId, checkUserAccess } from '@/lib/firestore';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      );
    }
    
    console.log('📊 [Subscription Status API] Checking status for user:', userId);
    
    // Obtener suscripción
    const subscription = await getSubscriptionByUserId(userId);
    
    if (!subscription) {
      console.log('❌ [Subscription Status API] No subscription found for user:', userId);
      return NextResponse.json({
        hasSubscription: false,
        hasAccess: false,
        subscription: null,
        accessInfo: {
          reason: 'no_subscription',
          message: 'No tienes una suscripción activa'
        }
      });
    }
    
    // Verificar acceso
    const accessCheck = await checkUserAccess(userId);
    
    // Calcular días restantes y estado
    const now = new Date();
    const endDate = new Date(subscription.endDate);
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    let statusMessage = '';
    let statusColor = 'green';
    
    if (accessCheck.hasAccess) {
      if (accessCheck.reason === 'grace_period') {
        statusMessage = `Tu suscripción venció pero tienes ${Math.max(0, daysRemaining + 10)} días de gracia restantes`;
        statusColor = 'orange';
      } else {
        statusMessage = daysRemaining > 0 
          ? `Tu suscripción está activa. Vence en ${daysRemaining} días`
          : 'Tu suscripción está activa';
        statusColor = 'green';
      }
    } else {
      switch (accessCheck.reason) {
        case 'access_blocked':
          statusMessage = 'Tu acceso ha sido bloqueado por falta de pago';
          statusColor = 'red';
          break;
        case 'subscription_inactive':
          statusMessage = 'Tu suscripción no está activa';
          statusColor = 'red';
          break;
        case 'expired':
          statusMessage = 'Tu suscripción ha vencido y el período de gracia ha terminado';
          statusColor = 'red';
          break;
        default:
          statusMessage = 'No tienes acceso a la plataforma';
          statusColor = 'red';
      }
    }
    
    console.log('📊 [Subscription Status API] Status calculated:', {
      userId,
      hasAccess: accessCheck.hasAccess,
      status: subscription.status,
      daysRemaining,
      reason: accessCheck.reason
    });
    
    return NextResponse.json({
      hasSubscription: true,
      hasAccess: accessCheck.hasAccess,
      subscription: {
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
        paymentHistory: subscription.paymentHistory || []
      },
      accessInfo: {
        reason: accessCheck.reason,
        message: statusMessage,
        color: statusColor
      }
    });
    
  } catch (error) {
    console.error('❌ [Subscription Status API] Error getting subscription status:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription status' },
      { status: 500 }
    );
  }
}