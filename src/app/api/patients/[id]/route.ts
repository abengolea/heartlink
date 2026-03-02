import { NextRequest, NextResponse } from 'next/server';
import { getPatientById, updatePatient, getDoctorsByOperator } from '@/lib/firestore';
import { getAuthenticatedUser } from '@/lib/api-auth';

/**
 * Regla: médico solicitante y operador pueden editar pacientes.
 * - Operador: puede cambiar requesterId (a qué médico solicitante corresponde).
 * - Solicitante: requesterId se fuerza a él mismo.
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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const { id } = await params;
    const patient = await getPatientById(id);
    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(patient);
  } catch (error) {
    console.error('Error getting patient:', error);
    return NextResponse.json(
      { error: 'Failed to get patient' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const role = authUser.dbUser.role;
    const allowedRoles = ['admin', 'operator', 'solicitante', 'medico_solicitante'];
    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ error: 'Sin permisos para editar pacientes' }, { status: 403 });
    }

    const { id } = await params;
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
    await updatePatient(id, dataToSave);
    return NextResponse.json({ success: true, message: 'Patient updated successfully' });
  } catch (error) {
    console.error('Error updating patient:', error);
    return NextResponse.json(
      { error: 'Failed to update patient' },
      { status: 500 }
    );
  }
}