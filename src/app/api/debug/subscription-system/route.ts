import { NextRequest, NextResponse } from 'next/server';
import { 
  createUser,
  createSubscription,
  getSubscriptionByUserId,
  checkUserAccess,
  updateSubscription
} from '@/lib/firestore';
import { verifySubscriptionAccess } from '@/middleware/subscription-access';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 [DEBUG] Testing subscription system...');
    
    const results: any = {
      timestamp: new Date().toISOString(),
      tests: {},
      summary: {
        passed: 0,
        failed: 0,
        total: 0
      }
    };
    
    // Test 1: Crear usuario de prueba
    try {
      console.log('🧪 [DEBUG] Test 1: Creating test user...');
      
      const testUserId = await createUser({
        name: 'Dr. Test Suscripción',
        email: 'test.subscription@heartlink.app',
        role: 'operator',
        specialty: 'Cardiología',
        status: 'active',
        subscriptionStatus: 'inactive'
      });
      
      results.tests.createUser = {
        status: 'PASSED',
        userId: testUserId,
        message: 'User created successfully'
      };
      results.summary.passed++;
      
    } catch (error) {
      results.tests.createUser = {
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      results.summary.failed++;
    }
    results.summary.total++;
    
    // Test 2: Verificar acceso sin suscripción
    try {
      console.log('🧪 [DEBUG] Test 2: Checking access without subscription...');
      
      const userId = results.tests.createUser?.userId;
      if (!userId) throw new Error('No user ID from previous test');
      
      const accessResult = await verifySubscriptionAccess(userId);
      
      if (!accessResult.hasAccess && accessResult.reason === 'no_subscription') {
        results.tests.accessWithoutSubscription = {
          status: 'PASSED',
          hasAccess: accessResult.hasAccess,
          reason: accessResult.reason,
          message: 'Correctly denied access without subscription'
        };
        results.summary.passed++;
      } else {
        throw new Error('Expected access to be denied without subscription');
      }
      
    } catch (error) {
      results.tests.accessWithoutSubscription = {
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      results.summary.failed++;
    }
    results.summary.total++;
    
    // Test 3: Crear suscripción activa
    try {
      console.log('🧪 [DEBUG] Test 3: Creating active subscription...');
      
      const userId = results.tests.createUser?.userId;
      if (!userId) throw new Error('No user ID from previous test');
      
      const now = new Date();
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + 1);
      
      const gracePeriodEndDate = new Date(endDate);
      gracePeriodEndDate.setDate(gracePeriodEndDate.getDate() + 10);
      
      const subscriptionId = await createSubscription({
        userId,
        status: 'active',
        planType: 'monthly',
        amount: 5000,
        currency: 'ARS',
        
        startDate: now.toISOString(),
        endDate: endDate.toISOString(),
        nextBillingDate: endDate.toISOString(),
        gracePeriodEndDate: gracePeriodEndDate.toISOString(),
        
        isAccessBlocked: false,
        paymentHistory: []
      });
      
      results.tests.createSubscription = {
        status: 'PASSED',
        subscriptionId,
        endDate: endDate.toISOString(),
        message: 'Active subscription created successfully'
      };
      results.summary.passed++;
      
    } catch (error) {
      results.tests.createSubscription = {
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      results.summary.failed++;
    }
    results.summary.total++;
    
    // Test 4: Verificar acceso con suscripción activa
    try {
      console.log('🧪 [DEBUG] Test 4: Checking access with active subscription...');
      
      const userId = results.tests.createUser?.userId;
      if (!userId) throw new Error('No user ID from previous test');
      
      const accessResult = await verifySubscriptionAccess(userId);
      
      if (accessResult.hasAccess && !accessResult.reason) {
        results.tests.accessWithActiveSubscription = {
          status: 'PASSED',
          hasAccess: accessResult.hasAccess,
          message: 'Correctly granted access with active subscription'
        };
        results.summary.passed++;
      } else {
        throw new Error('Expected access to be granted with active subscription');
      }
      
    } catch (error) {
      results.tests.accessWithActiveSubscription = {
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      results.summary.failed++;
    }
    results.summary.total++;
    
    // Test 5: Simular suscripción vencida (período de gracia)
    try {
      console.log('🧪 [DEBUG] Test 5: Simulating expired subscription in grace period...');
      
      const userId = results.tests.createUser?.userId;
      const subscriptionId = results.tests.createSubscription?.subscriptionId;
      if (!userId || !subscriptionId) throw new Error('No user ID or subscription ID from previous tests');
      
      // Establecer fecha de vencimiento en el pasado
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5); // 5 días atrás
      
      const gracePeriodEnd = new Date();
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 5); // +5 días desde ahora
      
      await updateSubscription(subscriptionId, {
        endDate: pastDate.toISOString(),
        gracePeriodEndDate: gracePeriodEnd.toISOString()
      });
      
      const accessResult = await verifySubscriptionAccess(userId);
      
      if (accessResult.hasAccess && accessResult.reason === 'grace_period') {
        results.tests.gracePeriodAccess = {
          status: 'PASSED',
          hasAccess: accessResult.hasAccess,
          reason: accessResult.reason,
          message: 'Correctly granted access during grace period'
        };
        results.summary.passed++;
      } else {
        throw new Error('Expected access to be granted during grace period');
      }
      
    } catch (error) {
      results.tests.gracePeriodAccess = {
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      results.summary.failed++;
    }
    results.summary.total++;
    
    // Test 6: Simular suscripción completamente vencida
    try {
      console.log('🧪 [DEBUG] Test 6: Simulating completely expired subscription...');
      
      const userId = results.tests.createUser?.userId;
      const subscriptionId = results.tests.createSubscription?.subscriptionId;
      if (!userId || !subscriptionId) throw new Error('No user ID or subscription ID from previous tests');
      
      // Establecer fechas de vencimiento y gracia en el pasado
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 15); // 15 días atrás
      
      const pastGracePeriod = new Date();
      pastGracePeriod.setDate(pastGracePeriod.getDate() - 5); // 5 días atrás
      
      await updateSubscription(subscriptionId, {
        endDate: pastDate.toISOString(),
        gracePeriodEndDate: pastGracePeriod.toISOString()
      });
      
      const accessResult = await verifySubscriptionAccess(userId);
      
      if (!accessResult.hasAccess && accessResult.reason === 'expired') {
        results.tests.expiredAccess = {
          status: 'PASSED',
          hasAccess: accessResult.hasAccess,
          reason: accessResult.reason,
          message: 'Correctly denied access after grace period expired'
        };
        results.summary.passed++;
      } else {
        throw new Error('Expected access to be denied after grace period expired');
      }
      
    } catch (error) {
      results.tests.expiredAccess = {
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      results.summary.failed++;
    }
    results.summary.total++;
    
    console.log('🧪 [DEBUG] All subscription tests completed');
    console.log(`✅ Passed: ${results.summary.passed}/${results.summary.total}`);
    console.log(`❌ Failed: ${results.summary.failed}/${results.summary.total}`);
    
    return NextResponse.json(results);
    
  } catch (error) {
    console.error('❌ [DEBUG] Error in subscription system test:', error);
    return NextResponse.json(
      { 
        error: 'Failed to test subscription system',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}