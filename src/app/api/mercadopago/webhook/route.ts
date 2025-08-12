import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { 
  getSubscriptionByUserId, 
  updateSubscription, 
  addPaymentRecord, 
  updateUser 
} from '@/lib/firestore';
import type { MercadoPagoWebhookEvent, PaymentRecord } from '@/lib/types';

// Configurar MercadoPago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

const payment = new Payment(client);

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 [MercadoPago Webhook] Received notification');
    
    const body = await request.json() as MercadoPagoWebhookEvent;
    
    console.log('🔔 [MercadoPago Webhook] Event data:', {
      id: body.id,
      type: body.type,
      action: body.action,
      data: body.data
    });
    
    // Verificar que es una notificación de pago
    if (body.type !== 'payment') {
      console.log('⏭️ [MercadoPago Webhook] Skipping non-payment event');
      return NextResponse.json({ status: 'ignored' });
    }
    
    // Obtener detalles del pago
    const paymentId = body.data.id;
    console.log('💰 [MercadoPago Webhook] Processing payment:', paymentId);
    
    const paymentData = await payment.get({ id: paymentId });
    
    if (!paymentData) {
      console.error('❌ [MercadoPago Webhook] Payment not found:', paymentId);
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }
    
    console.log('💰 [MercadoPago Webhook] Payment details:', {
      id: paymentData.id,
      status: paymentData.status,
      external_reference: paymentData.external_reference,
      transaction_amount: paymentData.transaction_amount,
      currency_id: paymentData.currency_id,
      date_created: paymentData.date_created,
      date_approved: paymentData.date_approved,
    });
    
    // Extraer userId del external_reference (formato: subscription_userId_timestamp)
    const externalRef = paymentData.external_reference;
    if (!externalRef || !externalRef.startsWith('subscription_')) {
      console.error('❌ [MercadoPago Webhook] Invalid external reference:', externalRef);
      return NextResponse.json({ error: 'Invalid external reference' }, { status: 400 });
    }
    
    const userId = externalRef.split('_')[1];
    if (!userId) {
      console.error('❌ [MercadoPago Webhook] Cannot extract userId from external reference:', externalRef);
      return NextResponse.json({ error: 'Cannot extract userId' }, { status: 400 });
    }
    
    console.log('👤 [MercadoPago Webhook] Processing payment for user:', userId);
    
    // Obtener suscripción del usuario
    const subscription = await getSubscriptionByUserId(userId);
    if (!subscription) {
      console.error('❌ [MercadoPago Webhook] Subscription not found for user:', userId);
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }
    
    // Crear registro de pago
    const paymentRecord: PaymentRecord = {
      id: String(paymentData.id),
      subscriptionId: subscription.id,
      mercadoPagoPaymentId: String(paymentData.id),
      amount: paymentData.transaction_amount || 0,
      currency: 'ARS',
      status: paymentData.status as PaymentRecord['status'],
      paymentDate: paymentData.date_approved || paymentData.date_created || new Date().toISOString(),
      dueDate: subscription.endDate,
      paymentMethod: paymentData.payment_method_id || 'unknown',
      description: `Pago mensual HeartLink - ${new Date().toLocaleDateString('es-AR')}`,
      failureReason: paymentData.status_detail || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Agregar el registro de pago a la suscripción
    await addPaymentRecord(subscription.id, paymentRecord);
    
    // Procesar según el estado del pago
    if (paymentData.status === 'approved') {
      console.log('✅ [MercadoPago Webhook] Payment approved, activating subscription');
      
      // Calcular nuevas fechas
      const now = new Date();
      const newEndDate = new Date(now);
      newEndDate.setMonth(newEndDate.getMonth() + 1); // +1 mes
      
      const newGracePeriodEndDate = new Date(newEndDate);
      newGracePeriodEndDate.setDate(newGracePeriodEndDate.getDate() + 10); // +10 días de gracia
      
      // Actualizar suscripción
      await updateSubscription(subscription.id, {
        status: 'active',
        endDate: newEndDate.toISOString(),
        nextBillingDate: newEndDate.toISOString(),
        gracePeriodEndDate: newGracePeriodEndDate.toISOString(),
        lastPaymentDate: paymentRecord.paymentDate,
        isAccessBlocked: false,
      });
      
      // Actualizar usuario
      await updateUser(userId, {
        subscriptionStatus: 'active',
      });
      
      console.log('✅ [MercadoPago Webhook] Subscription activated for user:', userId);
      
    } else if (paymentData.status === 'rejected' || paymentData.status === 'cancelled') {
      console.log('❌ [MercadoPago Webhook] Payment failed:', paymentData.status);
      
      // No cambiar el estado de la suscripción aquí, 
      // se manejará en el cron job de vencimientos
      
    } else {
      console.log('⏳ [MercadoPago Webhook] Payment pending:', paymentData.status);
      // El pago está pendiente, no hacer nada por ahora
    }
    
    return NextResponse.json({ 
      status: 'processed',
      paymentId: paymentData.id,
      paymentStatus: paymentData.status,
      userId: userId,
    });
    
  } catch (error) {
    console.error('❌ [MercadoPago Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

// Para desarrollo - obtener detalles de un pago específico
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const paymentId = url.searchParams.get('payment_id');
    
    if (!paymentId) {
      return NextResponse.json(
        { error: 'payment_id parameter is required' },
        { status: 400 }
      );
    }
    
    console.log('🔍 [MercadoPago API] Getting payment details:', paymentId);
    
    const paymentData = await payment.get({ id: paymentId });
    
    return NextResponse.json({
      payment: paymentData,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('❌ [MercadoPago API] Error getting payment:', error);
    return NextResponse.json(
      { error: 'Failed to get payment details' },
      { status: 500 }
    );
  }
}