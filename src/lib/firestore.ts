import { initializeFirebaseAdmin } from '@/lib/firebase-admin-v4';
import { getFirestore } from 'firebase-admin/firestore';
import type { Study } from './types';

// Initialize Firestore with Firebase Admin
function getFirestoreAdmin() {
  const app = initializeFirebaseAdmin();
  return getFirestore(app);
}

// Create a new study in Firestore
export async function createStudy(studyData: Omit<Study, 'id'>): Promise<string> {
  console.log('🔍 [Firestore] Creating new study...');
  
  try {
    const db = getFirestoreAdmin();
    const studiesRef = db.collection('studies');
    
    const docRef = await studiesRef.add({
      ...studyData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('✅ [Firestore] Study created with ID:', docRef.id);
    return docRef.id;
    
  } catch (error) {
    console.error('❌ [Firestore] Error creating study:', error);
    throw new Error(`Failed to create study in Firestore: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Get a study by ID from Firestore
export async function getStudyById(id: string): Promise<Study | null> {
  console.log('🔍 [Firestore] Getting study by ID:', id);
  
  try {
    const db = getFirestoreAdmin();
    const studyDoc = await db.collection('studies').doc(id).get();
    
    if (!studyDoc.exists) {
      console.log('❌ [Firestore] Study not found:', id);
      return null;
    }
    
    const data = studyDoc.data();
    console.log('✅ [Firestore] Study found:', id);
    
    return {
      id: studyDoc.id,
      ...data
    } as Study;
    
  } catch (error) {
    console.error('❌ [Firestore] Error getting study:', error);
    throw new Error(`Failed to get study from Firestore: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Get all studies from Firestore
export async function getAllStudies(): Promise<Study[]> {
  console.log('🔍 [Firestore] Getting all studies...');
  
  try {
    const db = getFirestoreAdmin();
    const studiesSnapshot = await db.collection('studies')
      .orderBy('createdAt', 'desc')
      .get();
    
    const studies: Study[] = [];
    studiesSnapshot.forEach(doc => {
      studies.push({
        id: doc.id,
        ...doc.data()
      } as Study);
    });
    
    console.log('✅ [Firestore] Retrieved studies:', studies.length);
    return studies;
    
  } catch (error) {
    console.error('❌ [Firestore] Error getting studies:', error);
    throw new Error(`Failed to get studies from Firestore: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Create a patient in Firestore
export async function createPatient(patientData: {
  name: string;
  dni: string;
  dob: string;
  operatorId: string;
  requesterId: string;
}): Promise<string> {
  console.log('🔍 [Firestore] Creating new patient...');
  
  try {
    const db = getFirestoreAdmin();
    const patientsRef = db.collection('patients');
    
    const docRef = await patientsRef.add({
      ...patientData,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('✅ [Firestore] Patient created with ID:', docRef.id);
    return docRef.id;
    
  } catch (error) {
    console.error('❌ [Firestore] Error creating patient:', error);
    throw new Error(`Failed to create patient in Firestore: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Find or create patient by name
export async function findOrCreatePatient(
  patientName: string, 
  operatorId: string, 
  requesterId: string
): Promise<string> {
  console.log('🔍 [Firestore] Finding or creating patient:', patientName);
  
  try {
    const db = getFirestoreAdmin();
    
    // Try to find existing patient by name
    const existingPatients = await db.collection('patients')
      .where('name', '==', patientName)
      .limit(1)
      .get();
    
    if (!existingPatients.empty) {
      const patientId = existingPatients.docs[0].id;
      console.log('✅ [Firestore] Found existing patient:', patientId);
      return patientId;
    }
    
    // Create new patient if not found
    console.log('🔍 [Firestore] Patient not found, creating new one...');
    const patientId = await createPatient({
      name: patientName,
      dni: 'TBD', // To be determined
      dob: '1980-01-01', // Default date
      operatorId,
      requesterId
    });
    
    return patientId;
    
  } catch (error) {
    console.error('❌ [Firestore] Error finding/creating patient:', error);
    throw new Error(`Failed to find or create patient: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}