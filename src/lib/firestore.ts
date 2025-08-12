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
    const studiesSnapshot = await db.collection('studies').orderBy('createdAt', 'desc').get();
    
    const studies: Study[] = [];
    studiesSnapshot.forEach((doc) => {
      studies.push({
        id: doc.id,
        ...doc.data()
      } as Study);
    });
    
    console.log('✅ [Firestore] Found', studies.length, 'studies');
    return studies;
    
  } catch (error) {
    console.error('❌ [Firestore] Error getting studies:', error);
    throw new Error(`Failed to get studies from Firestore: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Update study in Firestore
export async function updateStudy(id: string, studyData: Partial<Study>): Promise<void> {
  console.log('🔄 [Firestore] Updating study:', id);
  
  try {
    const db = getFirestoreAdmin();
    await db.collection('studies').doc(id).update({
      ...studyData,
      updatedAt: new Date()
    });
    
    console.log('✅ [Firestore] Study updated:', id);
    
  } catch (error) {
    console.error('❌ [Firestore] Error updating study:', error);
    throw new Error(`Failed to update study in Firestore: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Create a new patient in Firestore
export async function createPatient(patientData: Omit<Patient, 'id'>): Promise<string> {
  console.log('🔍 [Firestore] Creating new patient...');
  
  try {
    const db = getFirestoreAdmin();
    const patientsRef = db.collection('patients');
    
    const docRef = await patientsRef.add({
      ...patientData,
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

// Get all patients from Firestore
export async function getAllPatients(): Promise<Patient[]> {
  console.log('🔍 [Firestore] Getting all patients...');
  
  try {
    const db = getFirestoreAdmin();
    const patientsSnapshot = await db.collection('patients').orderBy('name').get();
    
    const patients: Patient[] = [];
    patientsSnapshot.forEach((doc) => {
      patients.push({
        id: doc.id,
        ...doc.data()
      } as Patient);
    });
    
    console.log('✅ [Firestore] Found', patients.length, 'patients');
    return patients;
    
  } catch (error) {
    console.error('❌ [Firestore] Error getting patients:', error);
    throw new Error(`Failed to get patients from Firestore: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Create a new user in Firestore
export async function createUser(userData: Omit<User, 'id'>): Promise<string> {
  console.log('🔍 [Firestore] Creating new user...');
  
  try {
    const db = getFirestoreAdmin();
    const usersRef = db.collection('users');
    
    const docRef = await usersRef.add({
      ...userData,
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

// Get all users from Firestore
export async function getAllUsers(): Promise<User[]> {
  console.log('🔍 [Firestore] Getting all users...');
  
  try {
    const db = getFirestoreAdmin();
    const usersSnapshot = await db.collection('users').orderBy('name').get();
    
    const users: User[] = [];
    usersSnapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data()
      } as User);
    });
    
    console.log('✅ [Firestore] Found', users.length, 'users');
    return users;
    
  } catch (error) {
    console.error('❌ [Firestore] Error getting users:', error);
    throw new Error(`Failed to get users from Firestore: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Get user by ID from Firestore
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

// Update user in Firestore
export async function updateUser(id: string, userData: Partial<User>): Promise<void> {
  console.log('🔄 [Firestore] Updating user:', id);
  
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

// Delete user from Firestore
export async function deleteUser(id: string): Promise<void> {
  console.log('🗑️ [Firestore] Deleting user:', id);
  
  try {
    const db = getFirestoreAdmin();
    await db.collection('users').doc(id).delete();
    
    console.log('✅ [Firestore] User deleted:', id);
    
  } catch (error) {
    console.error('❌ [Firestore] Error deleting user:', error);
    throw new Error(`Failed to delete user from Firestore: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Update patient in Firestore
export async function updatePatient(id: string, patientData: Partial<Patient>): Promise<void> {
  console.log('🔄 [Firestore] Updating patient:', id);
  
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

// Update study transcription
export async function updateStudyTranscription(studyId: string, transcription: string): Promise<void> {
  console.log('💾 [Firestore] Updating study transcription:', studyId);
  
  try {
    const db = getFirestoreAdmin();
    await db.collection('studies').doc(studyId).update({
      transcription: transcription,
      updatedAt: new Date().toISOString()
    });
    
    console.log('✅ [Firestore] Study transcription updated successfully');
  } catch (error) {
    console.error('❌ [Firestore] Error updating study transcription:', error);
    throw new Error(`Failed to update study transcription: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}