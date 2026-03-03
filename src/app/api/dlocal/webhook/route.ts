import { NextRequest, NextResponse } from 'next/server';
import {
  getSubscriptionByExternalPaymentId,
  updateSubscription,
  addPaymentRecord,
  updateUser,
} from '@/lib/firestore';
import type { PaymentRecord } from '@/lib/types';

interface DLocalWebhookPayload {
  id: string;
  status: string;
  status_code?: string;
  status_detail?: string;
  order_id: string;
  amount?: number;
  currency?: string;
  created_date?: string;
  approved_date?: string;
  payer?: { user_reference?: string };
  [key: string]: unknown;
}

function mapDLocalStatusToPaymentRecord(status: string): PaymentRecord['status'] {
  if (status === 'PAID') return 'approved';
  if (status === 'PENDING') return 'pending';
  if (status === 'REJECTED' || status === 'CANCELLED') return 'rejected';
  return 'pending';
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 [DLocal Webhook] Received notification');

    const body = (await request.json()) as DLocalWebhookPayload;
    const { id: paymentId, status, order_id: orderId } = body;

    if (!paymentId) {
      return NextResponse.json({ error: 'Missing payment id' }, { status: 400 });
    }

    console.log('🔔 [DLocal Webhook] Payment:', { paymentId, status, orderId });

    const subscription = await getSubscriptionByExternalPaymentId(paymentId);
    if (!subscription) {
      console.warn('⚠️ [DLocal Webhook] No subscription found for payment:', paymentId);
      return NextResponse.json({ status: 'ignored', reason: 'subscription_not_found' });
    }

    const paymentRecord: PaymentRecord = {
      id: paymentId,
      subscriptionId: subscription.id,
      mercadoPagoPaymentId: paymentId,
      amount: body.amount ?? subscription.amount,
      currency: 'ARS',
      status: mapDLocalStatusToPaymentRecord(status),
      paymentDate:
        body.approved_date || body.created_date || new Date().toISOString(),
      dueDate: subscription.endDate,
      paymentMethod: 'DLocal',
      description: `Pago HeartLink - DLocal`,
      failureReason: body.status_detail,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await addPaymentRecord(subscription.id, paymentRecord);

    if (status === 'PAID') {
      console.log('✅ [DLocal Webhook] Payment approved, activating subscription');

      const now = new Date();
      const newEndDate = new Date(now);
      const isAnnual = subscription.planType === 'annual';
      if (isAnnual) {
        newEndDate.setFullYear(newEndDate.getFullYear() + 1);
      } else {
        newEndDate.setMonth(newEndDate.getMonth() + 1);
      }
      const newGracePeriodEndDate = new Date(newEndDate);
      newGracePeriodEndDate.setDate(newGracePeriodEndDate.getDate() + 10);

      await updateSubscription(subscription.id, {
        status: 'active',
        endDate: newEndDate.toISOString(),
        nextBillingDate: newEndDate.toISOString(),
        gracePeriodEndDate: newGracePeriodEndDate.toISOString(),
        lastPaymentDate: paymentRecord.paymentDate,
        isAccessBlocked: false,
      });

      await updateUser(subscription.userId, {
        subscriptionStatus: 'active',
      });

      console.log('✅ [DLocal Webhook] Subscription activated for user:', subscription.userId);
    }

    return NextResponse.json({
      status: 'processed',
      paymentId,
      paymentStatus: status,
      userId: subscription.userId,
    });
  } catch (error) {
    console.error('❌ [DLocal Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}
