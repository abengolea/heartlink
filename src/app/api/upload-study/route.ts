import { NextResponse } from 'next/server';
import { uploadStudy } from '@/actions/upload-study';
import { verifySubscriptionAccess, createAccessControlResponse } from '@/middleware/subscription-access';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { uploadStudyVideoFromBuffer } from '@/services/firebase';
import { ALLOWED_VIDEO_TYPES, MAX_FILE_SIZE } from '@/lib/upload-constants';

export async function POST(request: Request) {
  console.log('🔍 [UPLOAD-STUDY] Starting upload study via endpoint...');
  
  try {
    // 🔐 Verificar autenticación (token Bearer en header)
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({
        success: false,
        error: 'Debes iniciar sesión para subir estudios',
        subscription_required: false,
        redirect_to: '/'
      }, { status: 401 });
    }
    
    const userId = authUser.dbUser.id;
    
    // Get the form data from the request
    const formData = await request.formData();
    
    console.log('🔍 [UPLOAD-STUDY] Received FormData entries for user:', userId);

    // Si viene el video en el FormData, subirlo por servidor (evita CORS/firewall del cliente)
    let filePath = formData.get('filePath') as string | null;
    const videoFile = formData.get('video') as File | null;

    if (videoFile && videoFile.size > 0) {
      console.log('📤 [UPLOAD-STUDY] Video recibido, subiendo por servidor...');
      if (videoFile.size > MAX_FILE_SIZE) {
        return NextResponse.json({ success: false, error: 'El archivo es demasiado grande. Máximo 100MB.' }, { status: 413 });
      }
      if (!ALLOWED_VIDEO_TYPES.includes(videoFile.type)) {
        return NextResponse.json({ success: false, error: 'Tipo de video no permitido.' }, { status: 415 });
      }
      const buffer = Buffer.from(await videoFile.arrayBuffer());
      filePath = await uploadStudyVideoFromBuffer(buffer, videoFile.name, videoFile.type);
      console.log('✅ [UPLOAD-STUDY] Video subido:', filePath);
      formData.delete('video');
      formData.set('filePath', filePath);
    } else if (!filePath) {
      return NextResponse.json({ success: false, error: 'Se requiere el video o filePath.' }, { status: 400 });
    }
    
    // 🔐 VERIFY SUBSCRIPTION ACCESS
    console.log('🔐 [UPLOAD-STUDY] Verifying subscription access for user:', userId);
    const accessResult = await verifySubscriptionAccess(userId);
    
    if (!accessResult.hasAccess) {
      // En desarrollo: permitir bypass a admin/operador sin suscripción o si hubo error técnico
      const isDev = process.env.NODE_ENV === 'development';
      const isOperatorOrAdmin = ['admin', 'operator'].includes(authUser.dbUser.role || '');
      const canBypass = isDev && isOperatorOrAdmin && (accessResult.reason === 'error' || accessResult.reason === 'no_subscription');
      if (canBypass) {
        console.log('⚠️ [UPLOAD-STUDY] Bypass en desarrollo: operador/admin sin suscripción');
      } else {
        console.log('🚫 [UPLOAD-STUDY] Access denied for user:', userId);
        const accessResponse = createAccessControlResponse(accessResult);
        return NextResponse.json(accessResponse, { status: 402 }); // 402 Payment Required
      }
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