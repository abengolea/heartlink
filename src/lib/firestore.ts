import { initializeFirebaseAdmin } from '@/lib/firebase-admin-v4';
import { getFirestore } from 'firebase-admin/firestore';
import type { Study, Patient, User, Subscription, PaymentRecord } from './types';

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

// Find or create a patient by name (for AI flow compatibility)
export async function findOrCreatePatient(patientName: string, requesterId: string): Promise<Patient> {
  console.log('🔍 [Firestore] Finding or creating patient:', patientName);
  
  try {
    const db = getFirestoreAdmin();
    
    // First, try to find existing patient
    const patientsSnapshot = await db.collection('patients')
      .where('name', '==', patientName)
      .limit(1)
      .get();
    
    if (!patientsSnapshot.empty) {
      const patientDoc = patientsSnapshot.docs[0];
      const existingPatient = {
        id: patientDoc.id,
        ...patientDoc.data()
      } as Patient;
      
      console.log('✅ [Firestore] Found existing patient:', existingPatient.id);
      return existingPatient;
    }
    
    // Create new patient if not found
    const newPatientData = {
      name: patientName,
      requesterId: requesterId,
      status: 'active'
    };
    
    const patientId = await createPatient(newPatientData);
    
    return {
      id: patientId,
      ...newPatientData
    } as Patient;
    
  } catch (error) {
    console.error('❌ [Firestore] Error finding/creating patient:', error);
    throw new Error(`Failed to find or create patient: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

// Get user by email from Firestore
export async function getUserByEmail(email: string): Promise<User | null> {
  console.log('📧 [Firestore] Getting user by email:', email);
  
  try {
    const db = getFirestoreAdmin();
    const usersSnapshot = await db.collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) {
      console.log('❌ [Firestore] User not found with email:', email);
      return null;
    }
    
    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();
    console.log('✅ [Firestore] User found by email:', email);
    
    return {
      id: userDoc.id,
      ...userData
    } as User;
    
  } catch (error) {
    console.error('❌ [Firestore] Error getting user by email:', error);
    throw new Error(`Failed to get user by email from Firestore: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

// ========================================
// SUBSCRIPTION MANAGEMENT FUNCTIONS
// ========================================

// Create a new subscription in Firestore
export async function createSubscription(subscriptionData: Omit<Subscription, 'id'>): Promise<string> {
  console.log('💳 [Firestore] Creating new subscription...');
  
  try {
    const db = getFirestoreAdmin();
    const subscriptionsRef = db.collection('subscriptions');
    
    const docRef = await subscriptionsRef.add({
      ...subscriptionData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    console.log('✅ [Firestore] Subscription created with ID:', docRef.id);
    return docRef.id;
    
  } catch (error) {
    console.error('❌ [Firestore] Error creating subscription:', error);
    throw new Error(`Failed to create subscription in Firestore: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Get subscription by user ID
export async function getSubscriptionByUserId(userId: string): Promise<Subscription | null> {
  console.log('💳 [Firestore] Getting subscription for user:', userId);
  
  try {
    const db = getFirestoreAdmin();
    const subscriptionsSnapshot = await db.collection('subscriptions')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
    
    if (subscriptionsSnapshot.empty) {
      console.log('❌ [Firestore] No subscription found for user:', userId);
      return null;
    }
    
    const subscriptionDoc = subscriptionsSnapshot.docs[0];
    const data = subscriptionDoc.data();
    
    console.log('✅ [Firestore] Subscription found for user:', userId);
    
    return {
      id: subscriptionDoc.id,
      ...data
    } as Subscription;
    
  } catch (error) {
    console.error('❌ [Firestore] Error getting subscription:', error);
    throw new Error(`Failed to get subscription from Firestore: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Update subscription in Firestore
export async function updateSubscription(id: string, subscriptionData: Partial<Subscription>): Promise<void> {
  console.log('💳 [Firestore] Updating subscription:', id);
  
  try {
    const db = getFirestoreAdmin();
    await db.collection('subscriptions').doc(id).update({
      ...subscriptionData,
      updatedAt: new Date().toISOString()
    });
    
    console.log('✅ [Firestore] Subscription updated:', id);
    
  } catch (error) {
    console.error('❌ [Firestore] Error updating subscription:', error);
    throw new Error(`Failed to update subscription in Firestore: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Add payment record to subscription
export async function addPaymentRecord(subscriptionId: string, paymentData: PaymentRecord): Promise<void> {
  console.log('💰 [Firestore] Adding payment record to subscription:', subscriptionId);
  
  try {
    const db = getFirestoreAdmin();
    
    // Get current subscription
    const subscriptionDoc = await db.collection('subscriptions').doc(subscriptionId).get();
    if (!subscriptionDoc.exists) {
      throw new Error('Subscription not found');
    }
    
    const subscription = subscriptionDoc.data() as Subscription;
    const updatedPaymentHistory = [...(subscription.paymentHistory || []), paymentData];
    
    await db.collection('subscriptions').doc(subscriptionId).update({
      paymentHistory: updatedPaymentHistory,
      lastPaymentDate: paymentData.paymentDate,
      updatedAt: new Date().toISOString()
    });
    
    console.log('✅ [Firestore] Payment record added to subscription:', subscriptionId);
    
  } catch (error) {
    console.error('❌ [Firestore] Error adding payment record:', error);
    throw new Error(`Failed to add payment record: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Check if user has active subscription and access
export async function checkUserAccess(userId: string): Promise<{ hasAccess: boolean; subscription: Subscription | null; reason?: string }> {
  console.log('🔐 [Firestore] Checking user access for:', userId);
  
  try {
    const subscription = await getSubscriptionByUserId(userId);
    
    if (!subscription) {
      console.log('❌ [Firestore] No subscription found for user:', userId);
      return { hasAccess: false, subscription: null, reason: 'no_subscription' };
    }
    
    // Check if access is blocked
    if (subscription.isAccessBlocked) {
      console.log('🚫 [Firestore] Access blocked for user:', userId);
      return { hasAccess: false, subscription, reason: 'access_blocked' };
    }
    
    // Check if subscription is active
    if (subscription.status !== 'active') {
      console.log('❌ [Firestore] Subscription not active for user:', userId);
      return { hasAccess: false, subscription, reason: 'subscription_inactive' };
    }
    
    // Check if still within grace period if overdue
    const now = new Date();
    const endDate = new Date(subscription.endDate);
    
    if (now > endDate) {
      const gracePeriodEnd = subscription.gracePeriodEndDate ? new Date(subscription.gracePeriodEndDate) : null;
      
      if (!gracePeriodEnd || now > gracePeriodEnd) {
        console.log('❌ [Firestore] Subscription expired and grace period ended:', userId);
        return { hasAccess: false, subscription, reason: 'expired' };
      } else {
        console.log('⚠️ [Firestore] Subscription expired but within grace period:', userId);
        return { hasAccess: true, subscription, reason: 'grace_period' };
      }
    }
    
    console.log('✅ [Firestore] User has active access:', userId);
    return { hasAccess: true, subscription };
    
  } catch (error) {
    console.error('❌ [Firestore] Error checking user access:', error);
    throw new Error(`Failed to check user access: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Get all expired subscriptions that need to be processed
export async function getExpiredSubscriptions(): Promise<Subscription[]> {
  console.log('⏰ [Firestore] Getting expired subscriptions...');
  
  try {
    const db = getFirestoreAdmin();
    const now = new Date().toISOString();
    
    const expiredSnapshot = await db.collection('subscriptions')
      .where('status', '==', 'active')
      .where('endDate', '<', now)
      .where('isAccessBlocked', '==', false)
      .get();
    
    const expiredSubscriptions: Subscription[] = [];
    expiredSnapshot.forEach((doc) => {
      expiredSubscriptions.push({
        id: doc.id,
        ...doc.data()
      } as Subscription);
    });
    
    console.log('⏰ [Firestore] Found', expiredSubscriptions.length, 'expired subscriptions');
    return expiredSubscriptions;
    
  } catch (error) {
    console.error('❌ [Firestore] Error getting expired subscriptions:', error);
    throw new Error(`Failed to get expired subscriptions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}