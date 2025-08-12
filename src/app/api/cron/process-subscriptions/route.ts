import { NextRequest, NextResponse } from 'next/server';
import { 
  getExpiredSubscriptions, 
  updateSubscription, 
  updateUser 
} from '@/lib/firestore';

export async function GET(request: NextRequest) {
  try {
    console.log('⏰ [Subscription Cron] Starting subscription processing...');
    
    // Verificar token de autorización (para seguridad)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN || 'heartlink-cron-2025';
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      console.log('🚫 [Subscription Cron] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Obtener suscripciones vencidas
    const expiredSubscriptions = await getExpiredSubscriptions();
    
    if (expiredSubscriptions.length === 0) {
      console.log('✅ [Subscription Cron] No expired subscriptions found');
      return NextResponse.json({
        message: 'No expired subscriptions to process',
        processed: 0,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`⏰ [Subscription Cron] Found ${expiredSubscriptions.length} expired subscriptions`);
    
    let processedCount = 0;
    let blockedCount = 0;
    
    const now = new Date();
    
    for (const subscription of expiredSubscriptions) {
      try {
        console.log(`⏰ [Subscription Cron] Processing subscription ${subscription.id} for user ${subscription.userId}`);
        
        const endDate = new Date(subscription.endDate);
        const gracePeriodEnd = subscription.gracePeriodEndDate 
          ? new Date(subscription.gracePeriodEndDate) 
          : new Date(endDate.getTime() + 10 * 24 * 60 * 60 * 1000); // +10 días
        
        // Verificar si el período de gracia ha terminado
        if (now > gracePeriodEnd) {
          console.log(`🚫 [Subscription Cron] Grace period ended for subscription ${subscription.id}, blocking access`);
          
          // Bloquear acceso
          await updateSubscription(subscription.id, {
            isAccessBlocked: true,
            status: 'suspended'
          });
          
          // Actualizar usuario
          await updateUser(subscription.userId, {
            subscriptionStatus: 'suspended'
          });
          
          blockedCount++;
          
        } else {
          console.log(`⚠️ [Subscription Cron] Subscription ${subscription.id} is in grace period until ${gracePeriodEnd.toISOString()}`);
          
          // Asegurar que la fecha de gracia esté establecida
          if (!subscription.gracePeriodEndDate) {
            await updateSubscription(subscription.id, {
              gracePeriodEndDate: gracePeriodEnd.toISOString()
            });
          }
        }
        
        processedCount++;
        
      } catch (error) {
        console.error(`❌ [Subscription Cron] Error processing subscription ${subscription.id}:`, error);
      }
    }
    
    console.log(`✅ [Subscription Cron] Completed processing. Processed: ${processedCount}, Blocked: ${blockedCount}`);
    
    return NextResponse.json({
      message: 'Subscription processing completed',
      processed: processedCount,
      blocked: blockedCount,
      total_expired: expiredSubscriptions.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [Subscription Cron] Error in cron job:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process subscriptions',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// También permitir POST para testing manual
export async function POST(request: NextRequest) {
  console.log('🧪 [Subscription Cron] Manual trigger via POST');
  return GET(request);
}