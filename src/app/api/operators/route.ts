import { NextResponse } from 'next/server';
import { getAllUsers } from '@/lib/firestore';

/**
 * GET: Lista los operadores del sistema (para el formulario de registro).
 * Público - no requiere auth. El solicitante elige con qué operador trabaja.
 */
export async function GET() {
  try {
    const users = await getAllUsers();
    const operators = users
      .filter(
        (u) =>
          u.role === 'operator' ||
          u.role === 'medico_operador'
      )
      .map((u) => ({ id: u.id, name: u.name, specialty: u.specialty }))
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    return NextResponse.json(operators);
  } catch (error) {
    console.error('Error getting operators:', error);
    return NextResponse.json(
      { error: 'Error al cargar operadores' },
      { status: 500 }
    );
  }
}
