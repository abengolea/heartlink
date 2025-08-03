import { NextResponse } from 'next/server';
import { createUser, createPatient } from '@/lib/firestore';

export async function POST() {
  try {
    console.log('🌱 Seeding initial test data...');
    
    // Create initial doctors
    const doctors = [
      { name: 'Dr. Juan Carlos Martínez', email: 'jmartinez@hospital.com', role: 'Cardiólogo', phone: '+54 9 11 1234-5678' },
      { name: 'Dra. María Elena Rodríguez', email: 'mrodriguez@clinica.com', role: 'Cardióloga', phone: '+54 9 11 8765-4321' },
      { name: 'Dr. Carlos Alberto González', email: 'cgonzalez@hospital.com', role: 'Cardiólogo Intervencionista', phone: '+54 9 11 5555-1234' }
    ];
    
    // Create initial patients 
    const patients = [
      { name: 'Ana María López', age: 45, gender: 'Femenino', phone: '+54 9 11 9999-1111', email: 'ana.lopez@email.com' },
      { name: 'Roberto Carlos Fernández', age: 62, gender: 'Masculino', phone: '+54 9 11 8888-2222', email: 'roberto.fernandez@email.com' },
      { name: 'Carmen Beatriz Silva', age: 38, gender: 'Femenino', phone: '+54 9 11 7777-3333', email: 'carmen.silva@email.com' }
    ];

    const createdDoctors = [];
    const createdPatients = [];

    // Create doctors
    for (const doctor of doctors) {
      try {
        const id = await createUser(doctor);
        createdDoctors.push({ id, ...doctor });
        console.log('✅ Created doctor:', doctor.name);
      } catch (error) {
        console.error('❌ Error creating doctor:', doctor.name, error);
      }
    }

    // Create patients
    for (const patient of patients) {
      try {
        const id = await createPatient(patient);
        createdPatients.push({ id, ...patient });
        console.log('✅ Created patient:', patient.name);
      } catch (error) {
        console.error('❌ Error creating patient:', patient.name, error);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Initial test data seeded successfully',
      data: {
        doctors: createdDoctors,
        patients: createdPatients
      }
    });

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    return NextResponse.json(
      { error: 'Failed to seed data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}