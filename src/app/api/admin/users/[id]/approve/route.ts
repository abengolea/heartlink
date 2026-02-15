import { NextRequest, NextResponse } from 'next/server';
import { getUserById, updateUser } from '@/lib/firestore';
import { requireRole } from '@/lib/api-auth';

/**
 * POST: Aprueba un usuario pendiente (cambia status a 'active')
 * Solo admin puede aprobar.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(request, ['admin']);
    const { id } = await params;

    const user = await getUserById(id);
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (user.status !== 'pending_approval') {
      return NextResponse.json(
        { error: 'El usuario no está pendiente de aprobación' },
        { status: 400 }
      );
    }

    await updateUser(id, { status: 'active' });

    return NextResponse.json({
      success: true,
      message: 'Usuario autorizado correctamente',
      user: { ...user, status: 'active' }
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '';
    if (msg === 'UNAUTHORIZED') return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    if (msg === 'FORBIDDEN') return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    console.error('Error approving user:', error);
    return NextResponse.json(
      { error: 'Error al autorizar usuario' },
      { status: 500 }
    );
  }
}
