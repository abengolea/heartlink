import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';

// Configurar MercadoPago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

const preference = new Preference(client);

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 [Test Payment] Creating test payment for $20,000...');
    
    const { email = 'test@heartlink.app', name = 'Usuario Test' } = await request.json();
    
    // Crear preferencia de pago de prueba
    const preferenceData = {
      items: [
        {
          id: 'heartlink-test-payment',
          title: 'HeartLink - Pago de Prueba Mensual',
          description: 'Suscripción mensual de prueba - $20,000 ARS',
          category_id: 'services',
          quantity: 1,
          currency_id: 'ARS',
          unit_price: 20000,
        }
      ],
      payer: {
        name,
        email,
      },
      payment_methods: {
        excluded_payment_types: [],
        excluded_payment_methods: [],
        installments: 1,
      },
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription?status=success&test=true`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription?status=failure&test=true`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription?status=pending&test=true`,
      },
      auto_return: 'approved',
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/mercadopago/webhook`,
      external_reference: `test_payment_${Date.now()}`,
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
    };
    
    console.log('💳 [Test Payment] Creating MercadoPago preference...');
    
    const response = await preference.create({ body: preferenceData });
    
    if (!response.id) {
      throw new Error('Failed to create MercadoPago preference');
    }
    
    console.log('✅ [Test Payment] Payment link created:', response.id);
    
    return NextResponse.json({
      success: true,
      testPayment: true,
      amount: 20000,
      currency: 'ARS',
      preferenceId: response.id,
      paymentUrl: response.init_point,
      sandboxUrl: response.sandbox_init_point,
      instructions: [
        '1. Usa el paymentUrl para pagar en vivo',
        '2. O usa sandboxUrl para testing',
        '3. El webhook procesará el pago automáticamente',
        '4. Revisa /dashboard/subscription después del pago'
      ]
    });
    
  } catch (error) {
    console.error('❌ [Test Payment] Error creating test payment:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create test payment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Test Payment Endpoint - Use POST to create a test payment',
    usage: {
      method: 'POST',
      body: {
        email: 'test@example.com (optional)',
        name: 'Test User (optional)'
      }
    },
    amount: '20000 ARS',
    description: 'Creates a test payment link for $20,000 ARS monthly subscription'
  });
}