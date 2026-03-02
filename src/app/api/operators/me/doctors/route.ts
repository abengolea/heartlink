import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import {
  getDoctorsByOperator,
  getOperatorsByRequester,
  addDoctorToOperator,
  getAllUsers,
} from '@/lib/firestore';

/**
 * GET: Operador/admin → Lista los médicos solicitantes con los que trabaja.
 * Médico solicitante → Lista los operadores (médicos que realizan estudios) con los que trabaja.
 * POST: Agrega un médico solicitante a la lista del operador (solo operador/admin).
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['admin', 'operator', 'medico_solicitante', 'solicitante']);

    const role = auth.dbUser.role;

    // Médico solicitante: ve los operadores con los que trabaja
    if (role === 'medico_solicitante' || role === 'solicitante') {
      const operators = await getOperatorsByRequester(auth.dbUser.id);
      return NextResponse.json(operators);
    }

    // Admin: ve todos los solicitantes
    if (role === 'admin') {
      const allUsers = await getAllUsers();
      const doctors = allUsers.filter(
        (u) => u.role === 'solicitante' || u.role === 'medico_solicitante'
      );
      return NextResponse.json(doctors.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
    }

    // Operador: ve sus médicos solicitantes
    const doctors = await getDoctorsByOperator(auth.dbUser.id);
    return NextResponse.json(doctors);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      }
      if (error.message === 'FORBIDDEN') {
        return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
      }
    }
    console.error('Error getting operator doctors:', error);
    return NextResponse.json({ error: 'Error al cargar médicos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['admin', 'operator']);
    const operatorId = auth.dbUser.id;

    const body = await request.json();
    const { requesterId } = body;
    if (!requesterId) {
      return NextResponse.json({ error: 'requesterId es requerido' }, { status: 400 });
    }

    await addDoctorToOperator(operatorId, requesterId);
    return NextResponse.json({ success: true, message: 'Médico agregado' });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      }
      if (error.message === 'FORBIDDEN') {
        return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
      }
    }
    console.error('Error adding doctor to operator:', error);
    return NextResponse.json({ error: 'Error al agregar médico' }, { status: 500 });
  }
}
