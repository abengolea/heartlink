import { NextResponse } from 'next/server';
import { getPatientById, updatePatient } from '@/lib/firestore';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const patient = await getPatientById(params.id);
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

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const patientData = await request.json();
    await updatePatient(params.id, patientData);
    return NextResponse.json({ success: true, message: 'Patient updated successfully' });
  } catch (error) {
    console.error('Error updating patient:', error);
    return NextResponse.json(
      { error: 'Failed to update patient' },
      { status: 500 }
    );
  }
}