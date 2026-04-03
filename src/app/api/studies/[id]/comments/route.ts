import { NextRequest, NextResponse } from 'next/server';
import { getStudyById, addCommentToStudy } from '@/lib/firestore';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { studyReadableByUser } from '@/lib/study-access';
import { verifySubscriptionAccess, createAccessControlResponse } from '@/middleware/subscription-access';

/**
 * POST: Agregar un comentario a un estudio
 * Requiere autenticación.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    if (authUser.dbUser.role !== 'admin') {
      const accessResult = await verifySubscriptionAccess(authUser.dbUser.id);
      if (!accessResult.hasAccess) {
        const res = createAccessControlResponse(accessResult);
        return NextResponse.json(res, { status: 402 });
      }
    }

    const { id: studyId } = await params;
    const study = await getStudyById(studyId);
    
    if (!study) {
      return NextResponse.json({ error: 'Estudio no encontrado' }, { status: 404 });
    }

    if (!(await studyReadableByUser(authUser, study))) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'El texto del comentario es obligatorio' },
        { status: 400 }
      );
    }

    await addCommentToStudy(studyId, {
      userId: authUser.dbUser.id,
      userName: authUser.dbUser.name,
      role: authUser.dbUser.role,
      text: text.trim(),
    });

    return NextResponse.json({
      success: true,
      message: 'Comentario agregado correctamente',
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json(
      { error: 'Error al agregar el comentario' },
      { status: 500 }
    );
  }
}
