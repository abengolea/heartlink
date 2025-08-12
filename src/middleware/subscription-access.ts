import { checkUserAccess } from '@/lib/firestore';

/**
 * Verifica si un usuario tiene acceso activo basado en su suscripción
 * @param userId - ID del usuario a verificar
 * @returns Objeto con información del acceso
 */
export async function verifySubscriptionAccess(userId: string) {
  try {
    console.log('🔐 [Access Control] Verifying access for user:', userId);
    
    const accessCheck = await checkUserAccess(userId);
    
    if (!accessCheck.hasAccess) {
      console.log('🚫 [Access Control] Access denied for user:', userId, 'Reason:', accessCheck.reason);
      
      let errorMessage = '';
      switch (accessCheck.reason) {
        case 'no_subscription':
          errorMessage = 'Necesitas suscribirte para acceder a esta funcionalidad';
          break;
        case 'access_blocked':
          errorMessage = 'Tu acceso ha sido bloqueado por falta de pago. Por favor, actualiza tu suscripción';
          break;
        case 'subscription_inactive':
          errorMessage = 'Tu suscripción no está activa. Por favor, renueva tu suscripción';
          break;
        case 'expired':
          errorMessage = 'Tu suscripción ha vencido. Por favor, renueva tu suscripción para continuar';
          break;
        default:
          errorMessage = 'No tienes acceso a esta funcionalidad';
      }
      
      return {
        hasAccess: false,
        subscription: accessCheck.subscription,
        reason: accessCheck.reason,
        message: errorMessage,
        shouldRedirectToSubscription: true
      };
    }
    
    // Usuario tiene acceso
    console.log('✅ [Access Control] Access granted for user:', userId);
    
    if (accessCheck.reason === 'grace_period') {
      console.log('⚠️ [Access Control] User in grace period:', userId);
      return {
        hasAccess: true,
        subscription: accessCheck.subscription,
        reason: accessCheck.reason,
        message: 'Tu suscripción ha vencido pero aún tienes acceso por algunos días. Te recomendamos renovar pronto.',
        shouldShowWarning: true
      };
    }
    
    return {
      hasAccess: true,
      subscription: accessCheck.subscription,
      reason: accessCheck.reason,
      message: 'Acceso autorizado'
    };
    
  } catch (error) {
    console.error('❌ [Access Control] Error verifying access:', error);
    return {
      hasAccess: false,
      subscription: null,
      reason: 'error',
      message: 'Error al verificar tu suscripción. Por favor, inténtalo de nuevo.',
      shouldRedirectToSubscription: false
    };
  }
}

/**
 * Hook para verificar acceso en rutas de API
 */
export function createAccessControlResponse(accessResult: Awaited<ReturnType<typeof verifySubscriptionAccess>>) {
  if (!accessResult.hasAccess) {
    return {
      error: accessResult.message,
      reason: accessResult.reason,
      subscription_required: true,
      redirect_to: '/dashboard/subscription'
    };
  }
  
  if (accessResult.shouldShowWarning) {
    return {
      warning: accessResult.message,
      reason: accessResult.reason,
      grace_period: true,
      recommend_renewal: true
    };
  }
  
  return null; // Sin restricciones
}