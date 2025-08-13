import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { createSubscription, getUserById, updateUser } from '@/lib/firestore';
import { getFirestoreAdmin } from '@/lib/firebase-admin-v4';
import { getFirestore } from 'firebase-admin/firestore';

// Configurar MercadoPago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
  options: {
    timeout: 5000,
    idempotencyKey: 'abc123'
  }
});

const preference = new Preference(client);

// Get pricing configuration from Firestore
async function getPricingConfig() {
  try {
    const app = getFirestoreAdmin();
    const db = getFirestore(app);
    const pricingDoc = await db.collection('admin').doc('pricing').get();
    
    if (!pricingDoc.exists) {
      // Return default pricing if not configured
      return {
        monthlyPrice: 20000,
        annualPrice: 144000,
        annualDiscountPercent: 40,
        currency: 'ARS',
        isActive: true
      };
    }
    
    return pricingDoc.data();
  } catch (error) {
    console.error('❌ [Subscription API] Error getting pricing config:', error);
    // Return default on error
    return {
      monthlyPrice: 20000,
      annualPrice: 144000,
      annualDiscountPercent: 40,
      currency: 'ARS',
      isActive: true
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, planType = 'monthly' } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
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
    const pricingConfig = await getPricingConfig();
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
    gracePeriodEndDate.setDate(gracePeriodEndDate.getDate() + 10); // +10 días de gracia
    
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
        success: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription?status=success&plan=${planType}`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription?status=failure&plan=${planType}`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription?status=pending&plan=${planType}`,
      },
      auto_return: 'approved',
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/mercadopago/webhook`,
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