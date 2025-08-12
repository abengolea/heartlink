import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { createSubscription, getUserById, updateUser } from '@/lib/firestore';

// Configurar MercadoPago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
  options: {
    timeout: 5000,
    idempotencyKey: 'abc123'
  }
});

const preference = new Preference(client);

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    console.log('💳 [Subscription API] Creating subscription for user:', userId);
    
    // Verificar que el usuario existe
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Configurar fechas
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 1); // +1 mes
    
    const gracePeriodEndDate = new Date(endDate);
    gracePeriodEndDate.setDate(gracePeriodEndDate.getDate() + 10); // +10 días de gracia
    
    // Crear preferencia de pago en MercadoPago
    const preferenceData = {
      items: [
        {
          id: 'heartlink-monthly',
          title: 'HeartLink - Suscripción Mensual',
          description: 'Acceso completo a HeartLink por 1 mes',
          category_id: 'services',
          quantity: 1,
          currency_id: 'ARS',
          unit_price: 5000,
        }
      ],
      payer: {
        name: user.name,
        email: user.email || `${userId}@heartlink.app`,
      },
      payment_methods: {
        excluded_payment_types: [],
        excluded_payment_methods: [],
        installments: 1,
      },
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription?status=success`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription?status=failure`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription?status=pending`,
      },
      auto_return: 'approved',
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/mercadopago/webhook`,
      external_reference: `subscription_${userId}_${now.getTime()}`,
      expires: true,
      expiration_date_from: now.toISOString(),
      expiration_date_to: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
    };
    
    console.log('💳 [Subscription API] Creating MercadoPago preference:', preferenceData);
    
    const response = await preference.create({ body: preferenceData });
    
    if (!response.id) {
      throw new Error('Failed to create MercadoPago preference');
    }
    
    console.log('✅ [Subscription API] MercadoPago preference created:', response.id);
    
    // Crear suscripción en Firestore (estado inicial: inactive)
    const subscriptionData = {
      userId,
      status: 'inactive' as const,
      planType: 'monthly' as const,
      amount: 5000,
      currency: 'ARS' as const,
      
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
      mercadoPagoPreferenceId: response.id,
      checkoutUrl: response.init_point,
      sandboxUrl: response.sandbox_init_point,
    });
    
  } catch (error) {
    console.error('❌ [Subscription API] Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}