import { NextResponse } from 'next/server';
import { getAllPatients } from '@/lib/firestore';

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