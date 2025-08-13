import { NextRequest, NextResponse } from 'next/server';
import { getSubscriptionByUserId, updateSubscription, updateUser } from '@/lib/firestore';

export async function POST(request: NextRequest) {
  console.log('🚫 [API] Processing subscription cancellation...');
  
  try {
    const { userId, reason = 'user_requested' } = await request.json();

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

    if (subscription.status === 'cancelled') {
      console.log('⚠️ [API] Subscription already cancelled:', subscription.id);
      return NextResponse.json(
        { error: 'Subscription is already cancelled' },
        { status: 400 }
      );
    }

    // Update subscription to cancelled
    const cancelData = {
      status: 'cancelled' as const,
      isAccessBlocked: true,
      cancellationReason: reason,
      cancellationDate: new Date().toISOString(),
    };

    console.log('🚫 [API] Cancelling subscription:', subscription.id);
    await updateSubscription(subscription.id, cancelData);

    // Update user status
    console.log('👤 [API] Updating user status:', userId);
    await updateUser(userId, {
      subscriptionStatus: 'cancelled'
    });

    console.log('✅ [API] Subscription cancelled successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
      subscriptionId: subscription.id,
      cancelledAt: cancelData.cancellationDate
    });

  } catch (error) {
    console.error('❌ [API] Error cancelling subscription:', error);
    return NextResponse.json(
      {
        error: 'Failed to cancel subscription',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}