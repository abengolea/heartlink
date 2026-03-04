import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { getSignedUploadUrl } from '@/services/firebase';
import { verifySubscriptionAccess, createAccessControlResponse } from '@/middleware/subscription-access';

/**
 * POST: Obtiene una URL firmada para subir el video a Firebase Storage.
 * Alternativa a la server action para evitar "Failed to fetch" en algunos entornos.
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Debes iniciar sesión' },
        { status: 401 }
      );
    }
    if (authUser.dbUser.role !== 'admin') {
      const accessResult = await verifySubscriptionAccess(authUser.dbUser.id);
      if (!accessResult.hasAccess) {
        const res = createAccessControlResponse(accessResult);
        return NextResponse.json({ success: false, ...res }, { status: 402 });
      }
    }

    const body = await request.json();
    const { fileType, fileName, fileSize } = body;

    if (!fileType || !fileName || fileSize == null) {
      return NextResponse.json(
        { success: false, error: 'fileType, fileName y fileSize son requeridos' },
        { status: 400 }
      );
    }

    const { uploadUrl, filePath } = await getSignedUploadUrl(
      fileType,
      fileName,
      Number(fileSize)
    );

    return NextResponse.json({
      success: true,
      uploadUrl,
      filePath,
    });
  } catch (error) {
    console.error('❌ [signed-url] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error al generar URL de subida',
      },
      { status: 500 }
    );
  }
}
