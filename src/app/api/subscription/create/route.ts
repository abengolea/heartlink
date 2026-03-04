import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { createSubscription, getUserById, updateUser } from '@/lib/firestore';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { getAdminPricingConfig } from '@/lib/admin-config';

// Configurar MercadoPago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
  options: {
    timeout: 5000,
  }
});

const preference = new Preference(client);

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, planType = 'monthly', simulate = false } = body;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Solo el propio usuario puede crear su suscripción (o admin para otro usuario)
    const isOwn = authUser.dbUser.id === userId;
    const isAdmin = authUser.dbUser.role === 'admin';
    if (!isOwn && !isAdmin) {
      return NextResponse.json(
        { error: 'No autorizado para crear suscripción para otro usuario' },
        { status: 403 }
      );
    }
    
    if (!['monthly', 'annual'].includes(planType)) {
      return NextResponse.json(
        { error: 'Plan type must be monthly or annual' },
        { status: 400 }
      );
    }
    
    console.log(`💳 [Subscription API] Creating ${planType} subscription for user:`, userId);
    
    // Verificar que el usuario existe
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Obtener configuración de precios
    const pricingConfig = await getAdminPricingConfig();
    console.log('💰 [Subscription API] Using pricing config:', pricingConfig);
    
    if (!pricingConfig.isActive) {
      return NextResponse.json(
        { error: 'Subscriptions are temporarily unavailable' },
        { status: 503 }
      );
    }
    
    // Determinar precio y descripción según el plan
    const isAnnual = planType === 'annual';
    const amount = isAnnual ? pricingConfig.annualPrice : pricingConfig.monthlyPrice;
    const period = isAnnual ? 'año' : 'mes';
    const title = `HeartLink - Suscripción ${isAnnual ? 'Anual' : 'Mensual'}`;
    const description = isAnnual 
      ? `Acceso completo a HeartLink por 1 año (${pricingConfig.annualDiscountPercent}% descuento)`
      : 'Acceso completo a HeartLink por 1 mes';
    
    // Configurar fechas
    const now = new Date();
    const endDate = new Date(now);
    
    if (isAnnual) {
      endDate.setFullYear(endDate.getFullYear() + 1); // +1 año
    } else {
      endDate.setMonth(endDate.getMonth() + 1); // +1 mes
    }
    
    const gracePeriodEndDate = new Date(endDate);
    gracePeriodEndDate.setDate(gracePeriodEndDate.getDate() + pricingConfig.gracePeriodDays);
    
    // MercadoPago exige HTTPS desde marzo 2025. En local (http://localhost) usamos la URL de producción.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://heartlink--heartlink-f4ftq.us-central1.hosted.app';
    const mpBaseUrl = appUrl.startsWith('http://') 
      ? 'https://heartlink--heartlink-f4ftq.us-central1.hosted.app'
      : appUrl.replace(/\/$/, '');

    // Modo simulación: solo cuando se envía simulate: true explícitamente (botón "Simular pago")
    // Los botones "Suscribirse Mensual" y "Suscribirse Anual" siempre llaman a MercadoPago
    if (simulate) {
      console.log('🎭 [Subscription API] SIMULATING payment - skipping MercadoPago');
      const now = new Date();
      const endDate = new Date(now);
      if (planType === 'annual') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }
      const gracePeriodEndDate = new Date(endDate);
      gracePeriodEndDate.setDate(gracePeriodEndDate.getDate() + pricingConfig.gracePeriodDays);

      const subscriptionIdPlaceholder = `pending_${Date.now()}`;
      const simulatedPaymentRecord = {
        id: `sim_${Date.now()}`,
        subscriptionId: subscriptionIdPlaceholder,
        mercadoPagoPaymentId: `simulated_${Date.now()}`,
        amount,
        currency: 'ARS' as const,
        status: 'approved' as const,
        paymentDate: now.toISOString(),
        dueDate: endDate.toISOString(),
        paymentMethod: 'simulado',
        description: `Pago único simulado $20.000 - HeartLink ${planType === 'annual' ? 'Anual' : 'Mensual'}`,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      const subscriptionData = {
        userId,
        status: 'active' as const,
        planType: planType as 'monthly' | 'annual',
        amount,
        currency: pricingConfig.currency as 'ARS',
        mercadoPagoSubscriptionId: `sim_${Date.now()}`,
        startDate: now.toISOString(),
        endDate: endDate.toISOString(),
        nextBillingDate: endDate.toISOString(),
        lastPaymentDate: now.toISOString(),
        gracePeriodEndDate: gracePeriodEndDate.toISOString(),
        isAccessBlocked: false,
        paymentHistory: [simulatedPaymentRecord],
      };

      const subscriptionId = await createSubscription(subscriptionData);
      // Actualizar subscriptionId en el registro de pago (era placeholder)
      simulatedPaymentRecord.subscriptionId = subscriptionId;

      await updateUser(userId, {
        subscriptionStatus: 'active',
        subscriptionId,
      });

      console.log('✅ [Subscription API] Simulated subscription created:', subscriptionId);
      // Usar origin del request para redirigir al mismo host (localhost en dev)
      let origin = mpBaseUrl;
      try {
        const o = request.headers.get('origin');
        const r = request.headers.get('referer');
        if (o) origin = o;
        else if (r) origin = new URL(r).origin;
      } catch {
        // fallback mpBaseUrl
      }
      const successUrl = `${origin}/dashboard/subscription?status=success&plan=${planType}&payment_id=simulated`;
      return NextResponse.json({
        success: true,
        simulated: true,
        subscriptionId,
        planType,
        amount,
        checkoutUrl: successUrl,
        message: 'Pago simulado exitoso. Redirigiendo...',
      });
    }
    
    // Crear preferencia de pago en MercadoPago
    const preferenceData = {
      items: [
        {
          id: `heartlink-${planType}`,
          title,
          description,
          category_id: 'services',
          quantity: 1,
          currency_id: pricingConfig.currency,
          unit_price: amount,
        }
      ],
      payer: {
        name: user.name,
        email: user.email || `${userId}@heartlink.app`,
      },
      payment_methods: {
        excluded_payment_types: [],
        excluded_payment_methods: [],
        installments: isAnnual ? 12 : 1, // Permitir cuotas para plan anual
      },
      back_urls: {
        success: `${mpBaseUrl}/dashboard/subscription?status=success&plan=${planType}`,
        failure: `${mpBaseUrl}/dashboard/subscription?status=failure&plan=${planType}`,
        pending: `${mpBaseUrl}/dashboard/subscription?status=pending&plan=${planType}`,
      },
      auto_return: 'approved',
      notification_url: `${mpBaseUrl}/api/mercadopago/webhook`,
      external_reference: `subscription_${userId}_${planType}_${now.getTime()}`,
      expires: true,
      expiration_date_from: now.toISOString(),
      expiration_date_to: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
    };
    
    console.log('💳 [Subscription API] Creating MercadoPago preference:', {
      planType,
      amount,
      title,
      userId
    });
    
    const response = await preference.create({ body: preferenceData });
    
    if (!response.id) {
      throw new Error('Failed to create MercadoPago preference');
    }
    
    console.log('✅ [Subscription API] MercadoPago preference created:', response.id);
    
    // Crear suscripción en Firestore (estado inicial: inactive)
    const subscriptionData = {
      userId,
      status: 'inactive' as const,
      planType: planType as 'monthly' | 'annual',
      amount,
      currency: pricingConfig.currency as 'ARS',
      
      // MercadoPago data
      mercadoPagoSubscriptionId: response.id,
      
      // Fechas
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      nextBillingDate: endDate.toISOString(),
      gracePeriodEndDate: gracePeriodEndDate.toISOString(),
      
      // Control de acceso
      isAccessBlocked: false,
      
      // Historial vacío
      paymentHistory: [],
    };
    
    const subscriptionId = await createSubscription(subscriptionData);
    
    // Actualizar usuario con referencia a la suscripción
    await updateUser(userId, {
      subscriptionStatus: 'inactive',
      subscriptionId: subscriptionId,
    });
    
    console.log('✅ [Subscription API] Subscription created in Firestore:', subscriptionId);
    
    return NextResponse.json({
      success: true,
      subscriptionId,
      planType,
      amount,
      mercadoPagoPreferenceId: response.id,
      checkoutUrl: response.init_point,
      sandboxUrl: response.sandbox_init_point,
      pricingInfo: {
        monthlyPrice: pricingConfig.monthlyPrice,
        annualPrice: pricingConfig.annualPrice,
        discount: isAnnual ? pricingConfig.annualDiscountPercent : 0,
        savings: isAnnual ? (pricingConfig.monthlyPrice * 12) - pricingConfig.annualPrice : 0
      }
    });
    
  } catch (error) {
    console.error('❌ [Subscription API] Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}