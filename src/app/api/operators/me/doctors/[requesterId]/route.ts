import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import { removeDoctorFromOperator } from '@/lib/firestore';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ requesterId: string }> }
) {
  try {
    const auth = await requireRole(request, ['admin', 'operator']);
    const { requesterId } = await params;

    await removeDoctorFromOperator(auth.dbUser.id, requesterId);
    return NextResponse.json({ success: true, message: 'Médico quitado de tu lista' });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      }
      if (error.message === 'FORBIDDEN') {
        return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
      }
    }
    console.error('Error removing doctor from operator:', error);
    return NextResponse.json({ error: 'Error al quitar médico' }, { status: 500 });
  }
}
