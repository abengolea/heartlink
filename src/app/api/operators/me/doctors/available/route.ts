import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import { getAllUsers, getDoctorsByOperator } from '@/lib/firestore';

/**
 * GET: Lista todos los médicos solicitantes del sistema que el operador
 * puede agregar a su lista (excluyendo los que ya tiene).
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['admin', 'operator', 'medico_operador']);
    const operatorId = auth.dbUser.id;

    const [allUsers, myDoctors] = await Promise.all([
      getAllUsers(),
      getDoctorsByOperator(operatorId),
    ]);

    const solicitantes = allUsers.filter(
      (u) => u.role === 'solicitante' || u.role === 'medico_solicitante'
    );
    const myIds = new Set(myDoctors.map((d) => d.id));
    const available = solicitantes.filter((s) => !myIds.has(s.id));

    return NextResponse.json(available.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      }
      if (error.message === 'FORBIDDEN') {
        return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
      }
    }
    console.error('Error getting available doctors:', error);
    return NextResponse.json({ error: 'Error al cargar médicos disponibles' }, { status: 500 });
  }
}
