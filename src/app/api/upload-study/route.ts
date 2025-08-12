import { NextResponse } from 'next/server';
import { uploadStudy } from '@/actions/upload-study';
import { verifySubscriptionAccess, createAccessControlResponse } from '@/middleware/subscription-access';

export async function POST(request: Request) {
  console.log('🔍 [UPLOAD-STUDY] Starting upload study via endpoint...');
  
  try {
    // Get the form data from the request
    const formData = await request.formData();
    
    console.log('🔍 [UPLOAD-STUDY] Received FormData entries:');
    for (const [key, value] of formData.entries()) {
      console.log(`🔍   ${key}: ${value}`);
    }
    
    // Extract userId from form data for subscription check
    const userId = formData.get('userId') as string;
    
    if (!userId) {
      console.error('❌ [UPLOAD-STUDY] No userId provided in form data');
      return NextResponse.json({
        success: false,
        error: 'Se requiere el ID del usuario para verificar la suscripción',
        subscription_required: true,
        redirect_to: '/dashboard/subscription'
      }, { status: 401 });
    }
    
    // 🔐 VERIFY SUBSCRIPTION ACCESS
    console.log('🔐 [UPLOAD-STUDY] Verifying subscription access for user:', userId);
    const accessResult = await verifySubscriptionAccess(userId);
    
    if (!accessResult.hasAccess) {
      console.log('🚫 [UPLOAD-STUDY] Access denied for user:', userId);
      const accessResponse = createAccessControlResponse(accessResult);
      return NextResponse.json(accessResponse, { status: 402 }); // 402 Payment Required
    }
    
    // Si está en período de gracia, mostrar advertencia pero permitir acceso
    if (accessResult.shouldShowWarning) {
      console.log('⚠️ [UPLOAD-STUDY] User in grace period:', userId);
    }
    
    console.log('✅ [UPLOAD-STUDY] Subscription verified, proceeding with upload...');
    console.log('🔍 [UPLOAD-STUDY] About to call uploadStudy server action...');
    
    const result = await uploadStudy(null, formData);
    
    console.log('✅ [UPLOAD-STUDY] Server action completed!');
    console.log('✅ [UPLOAD-STUDY] Result:', result);
    
    // Incluir información de suscripción en la respuesta si hay advertencias
    const response: any = {
      success: true,
      message: 'Upload study completed successfully',
      result: result,
      formDataReceived: Object.fromEntries(formData.entries()),
      logs: 'Check server console for detailed logs'
    };
    
    if (accessResult.shouldShowWarning) {
      response.subscription_warning = accessResult.message;
      response.recommend_renewal = true;
    }
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ [UPLOAD-STUDY] EXCEPTION:', error);
    console.error('❌ [UPLOAD-STUDY] Error type:', typeof error);
    console.error('❌ [UPLOAD-STUDY] Error constructor:', error?.constructor?.name);
    console.error('❌ [UPLOAD-STUDY] Error message:', error?.message);
    console.error('❌ [UPLOAD-STUDY] Error stack:', error?.stack);
    
    return NextResponse.json({
      success: false,
      error: error?.message || 'Unknown error',
      errorType: typeof error,
      errorConstructor: error?.constructor?.name,
      errorStack: error?.stack,
      logs: 'Check server console for detailed error logs'
    }, { status: 500 });
  }
}