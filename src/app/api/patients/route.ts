import { NextRequest, NextResponse } from 'next/server';
import { getAllPatients, createPatient, getDoctorsByOperator } from '@/lib/firestore';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { verifySubscriptionAccess, createAccessControlResponse } from '@/middleware/subscription-access';

/**
 * Regla: médico solicitante y operador pueden registrar pacientes.
 * - Operador: debe indicar requesterId (a qué médico solicitante corresponde).
 * - Solicitante: requesterId se fuerza a él mismo (el vínculo con operador ya existe).
 */
function resolveRequesterId(
  patientData: { requesterId?: string },
  authUser: { dbUser: { id: string; role: string } }
): string {
  const role = authUser.dbUser.role;
  if (role === 'medico_solicitante' || role === 'solicitante') {
    return authUser.dbUser.id;
  }
  return patientData.requesterId || '';
}

async function validateRequesterIdForOperator(
  requesterId: string,
  operatorId: string
): Promise<boolean> {
  const doctors = await getDoctorsByOperator(operatorId);
  return doctors.some((d) => d.id === requesterId);
}

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const patients = await getAllPatients();
    return NextResponse.json(patients);
  } catch (error) {
    console.error('Error getting patients:', error);
    return NextResponse.json(
      { error: 'Failed to get patients' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const role = authUser.dbUser.role;
    const allowedRoles = ['admin', 'operator', 'solicitante', 'medico_solicitante'];
    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ error: 'Sin permisos para registrar pacientes' }, { status: 403 });
    }

    if (role !== 'admin') {
      const accessResult = await verifySubscriptionAccess(authUser.dbUser.id);
      if (!accessResult.hasAccess) {
        const res = createAccessControlResponse(accessResult);
        return NextResponse.json(res, { status: 402 });
      }
    }

    const patientData = await request.json();
    const requesterId = resolveRequesterId(patientData, authUser);

    if (!requesterId) {
      return NextResponse.json(
        { error: 'Debe indicar a qué médico solicitante corresponde el paciente' },
        { status: 400 }
      );
    }

    if (role === 'operator') {
      const isValid = await validateRequesterIdForOperator(requesterId, authUser.dbUser.id);
      if (!isValid) {
        return NextResponse.json(
          { error: 'El médico solicitante seleccionado no está vinculado a tu cuenta' },
          { status: 400 }
        );
      }
    }

    const dataToSave = { ...patientData, requesterId };
    const patientId = await createPatient(dataToSave);
    return NextResponse.json({ id: patientId, success: true });
  } catch (error) {
    console.error('Error creating patient:', error);
    return NextResponse.json(
      { error: 'Failed to create patient' },
      { status: 500 }
    );
  }
}