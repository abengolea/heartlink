import { NextResponse } from 'next/server';
import { getAllPatients, createPatient } from '@/lib/firestore';

export async function GET() {
  try {
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

export async function POST(request: Request) {
  try {
    const patientData = await request.json();
    const patientId = await createPatient(patientData);
    return NextResponse.json({ id: patientId, success: true });
  } catch (error) {
    console.error('Error creating patient:', error);
    return NextResponse.json(
      { error: 'Failed to create patient' },
      { status: 500 }
    );
  }
}