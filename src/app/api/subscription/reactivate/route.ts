import { NextRequest, NextResponse } from 'next/server';
import { getSubscriptionByUserId, updateSubscription, updateUser } from '@/lib/firestore';

export async function POST(request: NextRequest) {
  console.log('🔄 [API] Processing subscription reactivation...');
  
  try {
    const { userId } = await request.json();

    if (!userId) {
      console.log('❌ [API] UserId is required');
      return NextResponse.json(
        { error: 'UserId is required' },
        { status: 400 }
      );
    }

    console.log('🔍 [API] Finding subscription for user:', userId);
    
    // Get current subscription
    const subscription = await getSubscriptionByUserId(userId);
    
    if (!subscription) {
      console.log('❌ [API] No subscription found for user:', userId);
      return NextResponse.json(
        { error: 'No subscription found for this user' },
        { status: 404 }
      );
    }

    if (subscription.status === 'active') {
      console.log('⚠️ [API] Subscription already active:', subscription.id);
      return NextResponse.json(
        { error: 'Subscription is already active' },
        { status: 400 }
      );
    }

    // Calculate new end date (1 month from now)
    const now = new Date();
    const newEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 days
    const newBillingDate = new Date(newEndDate.getTime() + 1 * 24 * 60 * 60 * 1000); // +1 day after end

    // Update subscription to active
    const reactivationData = {
      status: 'active' as const,
      isAccessBlocked: false,
      endDate: newEndDate.toISOString(),
      nextBillingDate: newBillingDate.toISOString(),
      reactivationDate: now.toISOString(),
      cancellationReason: undefined,
      cancellationDate: undefined,
    };

    console.log('🔄 [API] Reactivating subscription:', subscription.id);
    await updateSubscription(subscription.id, reactivationData);

    // Update user status
    console.log('👤 [API] Updating user status:', userId);
    await updateUser(userId, {
      subscriptionStatus: 'active'
    });

    console.log('✅ [API] Subscription reactivated successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Subscription reactivated successfully',
      subscriptionId: subscription.id,
      reactivatedAt: reactivationData.reactivationDate,
      newEndDate: reactivationData.endDate,
      nextBillingDate: reactivationData.nextBillingDate
    });

  } catch (error) {
    console.error('❌ [API] Error reactivating subscription:', error);
    return NextResponse.json(
      {
        error: 'Failed to reactivate subscription',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}