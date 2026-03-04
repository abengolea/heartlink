import { NextRequest, NextResponse } from 'next/server';
import { createDLocalGoPayment } from '@/lib/dlocal';
import { createSubscription, getUserById, updateUser } from '@/lib/firestore';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { getAdminPricingConfig } from '@/lib/admin-config';

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, planType = 'monthly', amount: customAmount } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId es obligatorio' }, { status: 400 });
    }

    const isOwn = authUser.dbUser.id === userId;
    const isAdmin = authUser.dbUser.role === 'admin';
    if (!isOwn && !isAdmin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const pricingConfig = await getAdminPricingConfig();
    const discountMultiplier = 1 - (pricingConfig.annualDiscountPercent / 100);
    const amount = customAmount ?? (planType === 'annual' ? pricingConfig.monthlyPrice * 12 * discountMultiplier : pricingConfig.monthlyPrice);
    const now = new Date();
    const endDate = new Date(now);
    if (planType === 'annual') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }
    const gracePeriodEndDate = new Date(endDate);
    gracePeriodEndDate.setDate(gracePeriodEndDate.getDate() + pricingConfig.gracePeriodDays);

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
      'https://heartlink--heartlink-f4ftq.us-central1.hosted.app';

    const webhookUrl =
      process.env.DLOCAL_WEBHOOK_URL || `${baseUrl}/api/dlocal/webhook`;

    const returnBase = process.env.DLOCAL_RETURN_URL;
    const callbackUrl = returnBase
      ? `${returnBase}${returnBase.includes('?') ? '&' : '?'}status=success&plan=${planType}&payment_id=dlocal`
      : `${baseUrl}/dashboard/subscription?status=success&plan=${planType}&payment_id=dlocal`;

    const orderId = `heartlink_${userId}_${planType}_${now.getTime()}`;

    const payload = {
      amount: Number(amount.toFixed(2)),
      currency: pricingConfig.currency,
      country: 'AR',
      payment_method_flow: 'REDIRECT' as const,
      payer: {
        name: user.name || 'Usuario HeartLink',
        email: user.email || `${userId}@heartlink.app`,
        document: '20123456',
        user_reference: userId,
      },
      order_id: orderId,
      description: `HeartLink - Suscripción ${planType === 'annual' ? 'Anual' : 'Mensual'}`,
      notification_url: webhookUrl,
      callback_url: callbackUrl,
    };

    const response = await createDLocalGoPayment(payload);
    const redirectUrl =
      response.redirect_url ||
      (response as Record<string, unknown>).url ||
      (response as Record<string, unknown>).checkout_url;

    if (!redirectUrl) {
      return NextResponse.json(
        { error: 'DLocal no devolvió URL de redirección', response },
        { status: 500 }
      );
    }

    const subscriptionData = {
      userId,
      status: 'inactive' as const,
      planType: planType as 'monthly' | 'annual',
      amount,
      currency: 'ARS' as const,
      mercadoPagoSubscriptionId: response.id,
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      nextBillingDate: endDate.toISOString(),
      gracePeriodEndDate: gracePeriodEndDate.toISOString(),
      isAccessBlocked: false,
      paymentHistory: [],
    };

    const subscriptionId = await createSubscription(subscriptionData);
    await updateUser(userId, {
      subscriptionStatus: 'inactive',
      subscriptionId,
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: redirectUrl,
      subscriptionId,
      planType,
      amount,
    });
  } catch (error) {
    console.error('❌ [DLocal] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al crear pago DLocal' },
      { status: 500 }
    );
  }
}
