import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers, updateUser } from '@/lib/firestore';
import { requireAuth } from '@/lib/api-auth';

const ADMIN_BOOTSTRAP_EMAIL =
  process.env.ADMIN_BOOTSTRAP_EMAIL || 'abengolea1@gmail.com';

/**
 * POST: Promueve al usuario actual a admin SI no existe ningún admin en el sistema.
 * Solo el email configurado (abengolea1@gmail.com por defecto) puede usar este endpoint.
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);

    if (
      authUser.email?.toLowerCase() !== ADMIN_BOOTSTRAP_EMAIL.toLowerCase()
    ) {
      return NextResponse.json(
        {
          error:
            'Solo el administrador designado puede usar esta función. Contacta al equipo.',
        },
        { status: 403 }
      );
    }

    const allUsers = await getAllUsers();
    const hasAdmin = allUsers.some((u) => u.role === 'admin');

    if (hasAdmin) {
      return NextResponse.json(
        {
          error:
            'Ya existe un administrador. Contacta al admin actual para que te otorgue permisos.',
        },
        { status: 403 }
      );
    }

    await updateUser(authUser.dbUser.id, {
      role: 'admin',
      specialty: authUser.dbUser.specialty || authUser.dbUser.role,
    });

    return NextResponse.json({
      success: true,
      message:
        '¡Listo! Ahora eres administrador. Recarga la página para acceder al panel.',
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '';
    if (msg === 'UNAUTHORIZED')
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    console.error('Error bootstrapping admin:', error);
    return NextResponse.json(
      { error: 'Error al promover a administrador' },
      { status: 500 }
    );
  }
}
