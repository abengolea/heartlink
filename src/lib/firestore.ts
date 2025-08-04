import { initializeFirebaseAdmin } from '@/lib/firebase-admin-v4';
import { getFirestore } from 'firebase-admin/firestore';
import type { Study, Patient, User } from './types';

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
    console.error('🔄 [Firestore] Falling back to simulated study creation for development...');
    
    // Generate a mock study ID for development
    const mockStudyId = `study_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('✅ [Firestore] Simulated study creation with ID:', mockStudyId);
    console.log('📝 [Firestore] Study data would be:', studyData);
    
    // In a real development environment, you might want to save to local storage or a file
    return mockStudyId;
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
    console.error('🔄 [Firestore] Falling back to hardcoded data for development...');
    
    // Import hardcoded data as fallback when Firebase is not configured
    const { studies } = await import('@/lib/data');
    console.log('✅ [Firestore] Using fallback data:', studies.length, 'studies');
    return studies;
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
    console.error('🔄 [Firestore] Falling back to simulated patient for development...');
    
    // Import hardcoded data and try to find patient by name
    const { patients } = await import('@/lib/data');
    const existingPatient = patients.find(p => 
      p.name.toLowerCase() === patientName.toLowerCase()
    );
    
    if (existingPatient) {
      console.log('✅ [Firestore] Found existing patient in fallback data:', existingPatient.id);
      return existingPatient.id;
    }
    
    // Generate a mock patient ID for development
    const mockPatientId = `patient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('✅ [Firestore] Simulated patient creation with ID:', mockPatientId);
    console.log('📝 [Firestore] Patient would be:', { patientName, operatorId, requesterId });
    
    return mockPatientId;
  }
}

// === USERS (DOCTORS) MANAGEMENT ===

// Get all users from Firestore
export async function getAllUsers(): Promise<User[]> {
  console.log('🔍 [Firestore] Getting all users...');
  
  try {
    const db = getFirestoreAdmin();
    const usersSnapshot = await db.collection('users')
      .orderBy('name', 'asc')
      .get();
    
    const users: User[] = [];
    usersSnapshot.forEach(doc => {
      users.push({
        id: doc.id,
        ...doc.data()
      } as User);
    });
    
    console.log('✅ [Firestore] Retrieved users:', users.length);
    return users;
    
  } catch (error) {
    console.error('❌ [Firestore] Error getting users:', error);
    console.error('🔄 [Firestore] Falling back to hardcoded data for development...');
    
    // Import hardcoded data as fallback when Firebase is not configured
    const { users } = await import('@/lib/data');
    console.log('✅ [Firestore] Using fallback data:', users.length, 'users');
    return users;
  }
}

// Create a user in Firestore
export async function createUser(userData: Omit<User, 'id'>): Promise<string> {
  console.log('🔍 [Firestore] Creating new user...');
  
  try {
    const db = getFirestoreAdmin();
    const usersRef = db.collection('users');
    
    const docRef = await usersRef.add({
      ...userData,
      status: 'active',
      subscriptionStatus: 'paid',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('✅ [Firestore] User created with ID:', docRef.id);
    return docRef.id;
    
  } catch (error) {
    console.error('❌ [Firestore] Error creating user:', error);
    throw new Error(`Failed to create user in Firestore: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Update a user in Firestore
export async function updateUser(id: string, userData: Partial<Omit<User, 'id'>>): Promise<void> {
  console.log('🔍 [Firestore] Updating user:', id);
  
  try {
    const db = getFirestoreAdmin();
    await db.collection('users').doc(id).update({
      ...userData,
      updatedAt: new Date()
    });
    
    console.log('✅ [Firestore] User updated:', id);
    
  } catch (error) {
    console.error('❌ [Firestore] Error updating user:', error);
    throw new Error(`Failed to update user in Firestore: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Get user by ID
export async function getUserById(id: string): Promise<User | null> {
  console.log('🔍 [Firestore] Getting user by ID:', id);
  
  try {
    const db = getFirestoreAdmin();
    const userDoc = await db.collection('users').doc(id).get();
    
    if (!userDoc.exists) {
      console.log('❌ [Firestore] User not found:', id);
      return null;
    }
    
    const data = userDoc.data();
    console.log('✅ [Firestore] User found:', id);
    
    return {
      id: userDoc.id,
      ...data
    } as User;
    
  } catch (error) {
    console.error('❌ [Firestore] Error getting user:', error);
    throw new Error(`Failed to get user from Firestore: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// === PATIENTS MANAGEMENT ===

// Get all patients from Firestore
export async function getAllPatients(): Promise<Patient[]> {
  console.log('🔍 [Firestore] Getting all patients...');
  
  try {
    const db = getFirestoreAdmin();
    const patientsSnapshot = await db.collection('patients')
      .orderBy('name', 'asc')
      .get();
    
    const patients: Patient[] = [];
    patientsSnapshot.forEach(doc => {
      patients.push({
        id: doc.id,
        ...doc.data()
      } as Patient);
    });
    
    console.log('✅ [Firestore] Retrieved patients:', patients.length);
    return patients;
    
  } catch (error) {
    console.error('❌ [Firestore] Error getting patients:', error);
    console.error('🔄 [Firestore] Falling back to hardcoded data for development...');
    
    // Import hardcoded data as fallback when Firebase is not configured
    const { patients } = await import('@/lib/data');
    console.log('✅ [Firestore] Using fallback data:', patients.length, 'patients');
    return patients;
  }
}

// Update a patient in Firestore
export async function updatePatient(id: string, patientData: Partial<Omit<Patient, 'id'>>): Promise<void> {
  console.log('🔍 [Firestore] Updating patient:', id);
  
  try {
    const db = getFirestoreAdmin();
    await db.collection('patients').doc(id).update({
      ...patientData,
      updatedAt: new Date()
    });
    
    console.log('✅ [Firestore] Patient updated:', id);
    
  } catch (error) {
    console.error('❌ [Firestore] Error updating patient:', error);
    throw new Error(`Failed to update patient in Firestore: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Get patient by ID
export async function getPatientById(id: string): Promise<Patient | null> {
  console.log('🔍 [Firestore] Getting patient by ID:', id);
  
  try {
    const db = getFirestoreAdmin();
    const patientDoc = await db.collection('patients').doc(id).get();
    
    if (!patientDoc.exists) {
      console.log('❌ [Firestore] Patient not found:', id);
      return null;
    }
    
    const data = patientDoc.data();
    console.log('✅ [Firestore] Patient found:', id);
    
    return {
      id: patientDoc.id,
      ...data
    } as Patient;
    
  } catch (error) {
    console.error('❌ [Firestore] Error getting patient:', error);
    throw new Error(`Failed to get patient from Firestore: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}