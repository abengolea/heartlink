import { randomBytes } from 'crypto';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin-v4';
import { getFirestore } from 'firebase-admin/firestore';
import { registerInNotificasHub } from '@/lib/notificashub';
import type { Study, StudyComment, Patient, User, Subscription, PaymentRecord, DataDeletionRequest, UserPreferences } from './types';

/** Envíos de prueba al crear un médico operador (notificación WhatsApp al solicitante) */
export const DEFAULT_OPERATOR_TRIAL_WHATSAPP_SENDS = 5;

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

/** Genera o obtiene el shareToken y URL pública de un estudio (para notificaciones WhatsApp, etc.) */
export async function generateOrGetShareTokenAndUrl(studyId: string): Promise<{ shareToken: string; publicUrl: string }> {
  const study = await getStudyById(studyId);
  if (!study) throw new Error('Estudio no encontrado');

  let shareToken = study.shareToken;
  if (!shareToken) {
    shareToken = randomBytes(32).toString('hex');
    await updateStudy(studyId, { shareToken });
  }

  const PRODUCTION_URL = 'https://heartlink--heartlink-f4ftq.us-central1.hosted.app';
  const baseUrl = process.env.NEXT_PUBLIC_PUBLIC_SHARE_BASE_URL || PRODUCTION_URL;
  const base = `${baseUrl.replace(/\/$/, '')}/public/study/${studyId}`;
  const searchParams = new URLSearchParams({ token: shareToken });
  const publicUrl = `${base}?${searchParams.toString()}`;

  return { shareToken, publicUrl };
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

// Add comment to study
export async function addCommentToStudy(studyId: string, comment: Omit<StudyComment, 'id' | 'timestamp'>): Promise<void> {
  console.log('💬 [Firestore] Adding comment to study:', studyId);
  
  try {
    const db = getFirestoreAdmin();
    const studyRef = db.collection('studies').doc(studyId);
    const studyDoc = await studyRef.get();
    
    if (!studyDoc.exists) {
      throw new Error('Study not found');
    }
    
    const study = studyDoc.data() as Study;
    const existingComments: StudyComment[] = study.comments || [];
    
    const newComment: StudyComment = {
      ...comment,
      id: `c${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    
    await studyRef.update({
      comments: [...existingComments, newComment],
      updatedAt: new Date()
    });
    
    console.log('✅ [Firestore] Comment added to study:', studyId);
  } catch (error) {
    console.error('❌ [Firestore] Error adding comment:', error);
    throw new Error(`Failed to add comment: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    
    const withTrial: Record<string, unknown> =
      userData.role === 'operator'
        ? {
            trialWhatsAppSendsRemaining:
              userData.trialWhatsAppSendsRemaining !== undefined
                ? userData.trialWhatsAppSendsRemaining
                : DEFAULT_OPERATOR_TRIAL_WHATSAPP_SENDS,
          }
        : {};

    const docRef = await usersRef.add({
      ...userData,
      ...withTrial,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('✅ [Firestore] User created with ID:', docRef.id);
    if (userData.phone?.trim()) {
      registerInNotificasHub(userData.phone);
    }
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

/** Normaliza número de teléfono para comparación (solo dígitos) */
function normalizePhoneForMatch(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Variantes de un número para matching flexible (Argentina: con/sin 9 tras 54).
 * Meta envía 5493364645357; el usuario puede tener 543364645357 en perfil.
 */
function getPhoneMatchVariants(digits: string): Set<string> {
  const variants = new Set<string>([digits]);
  // Argentina: 549XXXXXXXX (13) ↔ 54XXXXXXXX (12)
  if (digits.startsWith('549') && digits.length === 13) {
    variants.add('54' + digits.slice(3)); // quitar el 9
  }
  if (digits.startsWith('54') && !digits.startsWith('549') && digits.length === 12) {
    variants.add('549' + digits.slice(2)); // agregar el 9
  }
  return variants;
}

function phonesMatch(digitsA: string, digitsB: string): boolean {
  if (digitsA === digitsB) return true;
  const va = getPhoneMatchVariants(digitsA);
  const vb = getPhoneMatchVariants(digitsB);
  for (const a of va) {
    if (vb.has(a)) return true;
  }
  return false;
}

/**
 * Busca un operador por su número de WhatsApp.
 * El número debe estar guardado en User.phone o User (campo whatsappPhone si se agrega).
 * Acepta 5493364645357 y 543364645357 como el mismo número (Argentina móvil).
 */
export async function getOperatorByWhatsAppPhone(whatsappPhone: string): Promise<User | null> {
  const normalized = normalizePhoneForMatch(whatsappPhone);
  if (!normalized || normalized.length < 10) return null;

  try {
    const db = getFirestoreAdmin();
    const usersSnapshot = await db.collection('users')
      .where('role', 'in', ['operator', 'admin'])
      .get();

    for (const doc of usersSnapshot.docs) {
      const data = doc.data();
      const userPhone = data.phone || data.whatsappPhone || '';
      const storedDigits = normalizePhoneForMatch(userPhone);
      if (userPhone && phonesMatch(normalized, storedDigits)) {
        return { id: doc.id, ...data } as User;
      }
    }
    return null;
  } catch (error) {
    console.error('❌ [Firestore] Error getting operator by WhatsApp phone:', error);
    return null;
  }
}

/**
 * Busca un médico solicitante por número de teléfono.
 * Útil para crear/obtener solicitantes desde WhatsApp con solo el teléfono.
 */
export async function getSolicitanteByPhone(phone: string): Promise<User | null> {
  const normalized = normalizePhoneForMatch(phone);
  if (!normalized || normalized.length < 10) return null;

  try {
    const db = getFirestoreAdmin();
    const usersSnapshot = await db.collection('users')
      .where('role', 'in', ['solicitante', 'medico_solicitante'])
      .get();

    for (const doc of usersSnapshot.docs) {
      const data = doc.data();
      const userPhone = data.phone || '';
      const storedDigits = normalizePhoneForMatch(userPhone);
      if (userPhone && phonesMatch(normalized, storedDigits)) {
        return { id: doc.id, ...data } as User;
      }
    }
    return null;
  } catch (error) {
    console.error('❌ [Firestore] Error getting solicitante by phone:', error);
    return null;
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
    if (userData.phone !== undefined && String(userData.phone ?? '').trim()) {
      registerInNotificasHub(String(userData.phone));
    }
    
  } catch (error) {
    console.error('❌ [Firestore] Error updating user:', error);
    throw new Error(`Failed to update user in Firestore: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

const MAX_TRIAL_WHATSAPP_SENDS_CAP = 50_000;
const MAX_TRIAL_SENDS_ADD_PER_REQUEST = 500;

/** Suma envíos de prueba WhatsApp a un médico operador (uso admin). */
export async function addOperatorTrialWhatsAppSends(
  userId: string,
  amount: number
): Promise<{ previous: number; newTotal: number }> {
  if (
    !Number.isFinite(amount) ||
    Math.floor(amount) !== amount ||
    amount < 1 ||
    amount > MAX_TRIAL_SENDS_ADD_PER_REQUEST
  ) {
    throw new Error('INVALID_AMOUNT');
  }

  const user = await getUserById(userId);
  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }
  if (user.role !== 'operator') {
    throw new Error('NOT_OPERATOR');
  }

  const previous = user.trialWhatsAppSendsRemaining ?? 0;
  const newTotal = Math.min(previous + amount, MAX_TRIAL_WHATSAPP_SENDS_CAP);

  await updateUser(userId, { trialWhatsAppSendsRemaining: newTotal });
  console.log('✅ [Firestore] Trial WhatsApp sends bonificados:', userId, previous, '→', newTotal);

  return { previous, newTotal };
}

// Operator-Doctor relationship: médicos solicitantes con los que trabaja cada operador
export async function getDoctorsByOperator(operatorId: string): Promise<User[]> {
  try {
    const db = getFirestoreAdmin();
    const linksSnapshot = await db.collection('operator_doctors')
      .where('operatorId', '==', operatorId)
      .get();

    if (linksSnapshot.empty) return [];

    const requesterIds = linksSnapshot.docs.map(d => d.data().requesterId);
    const users: User[] = [];
    for (const rid of requesterIds) {
      const user = await getUserById(rid);
      if (user) users.push(user);
    }
    return users.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  } catch (error) {
    console.error('❌ [Firestore] Error getting operator doctors:', error);
    return [];
  }
}

export async function addDoctorToOperator(operatorId: string, requesterId: string): Promise<void> {
  try {
    const db = getFirestoreAdmin();
    const docId = `${operatorId}_${requesterId}`;
    const docRef = db.collection('operator_doctors').doc(docId);
    const existing = await docRef.get();
    if (existing.exists) return; // ya existe

    await docRef.set({
      operatorId,
      requesterId,
      createdAt: new Date(),
    });
    console.log('✅ [Firestore] Doctor added to operator:', operatorId, requesterId);
  } catch (error) {
    console.error('❌ [Firestore] Error adding doctor to operator:', error);
    throw new Error(`Failed to add doctor: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function removeDoctorFromOperator(operatorId: string, requesterId: string): Promise<void> {
  try {
    const db = getFirestoreAdmin();
    const docId = `${operatorId}_${requesterId}`;
    await db.collection('operator_doctors').doc(docId).delete();
    console.log('✅ [Firestore] Doctor removed from operator:', operatorId, requesterId);
  } catch (error) {
    console.error('❌ [Firestore] Error removing doctor from operator:', error);
    throw new Error(`Failed to remove doctor: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/** Operadores (médicos que realizan estudios) con los que trabaja un médico solicitante */
export async function getOperatorsByRequester(requesterId: string): Promise<User[]> {
  try {
    const db = getFirestoreAdmin();
    const linksSnapshot = await db.collection('operator_doctors')
      .where('requesterId', '==', requesterId)
      .get();

    if (linksSnapshot.empty) return [];

    const operatorIds = linksSnapshot.docs.map(d => d.data().operatorId);
    const users: User[] = [];
    for (const oid of operatorIds) {
      const user = await getUserById(oid);
      if (user) users.push(user);
    }
    return users.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  } catch (error) {
    console.error('❌ [Firestore] Error getting operators by requester:', error);
    return [];
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

// Get subscription by external payment ID (MercadoPago preference ID or DLocal payment ID)
export async function getSubscriptionByExternalPaymentId(externalId: string): Promise<Subscription | null> {
  try {
    const db = getFirestoreAdmin();
    const snapshot = await db.collection('subscriptions')
      .where('mercadoPagoSubscriptionId', '==', externalId)
      .limit(1)
      .get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Subscription;
  } catch (error) {
    console.error('❌ [Firestore] Error getting subscription by external ID:', error);
    return null;
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

export type UserAccessResult = {
  hasAccess: boolean;
  subscription: Subscription | null;
  reason?: string;
  trialSendsRemaining?: number;
};

// Check if user has active subscription and access
export async function checkUserAccess(userId: string): Promise<UserAccessResult> {
  console.log('🔐 [Firestore] Checking user access for:', userId);

  try {
    const subscription = await getSubscriptionByUserId(userId);

    if (subscription?.isAccessBlocked) {
      console.log('🚫 [Firestore] Access blocked for user:', userId);
      return { hasAccess: false, subscription, reason: 'access_blocked' };
    }

    if (subscription && subscription.status === 'active') {
      const now = new Date();
      const endDate = new Date(subscription.endDate);

      if (now <= endDate) {
        console.log('✅ [Firestore] User has active subscription:', userId);
        return { hasAccess: true, subscription };
      }

      const gracePeriodEnd = subscription.gracePeriodEndDate
        ? new Date(subscription.gracePeriodEndDate)
        : null;

      if (gracePeriodEnd && now <= gracePeriodEnd) {
        console.log('⚠️ [Firestore] Subscription expired but within grace period:', userId);
        return { hasAccess: true, subscription, reason: 'grace_period' };
      }
    }

    const user = await getUserById(userId);
    const trialLeft =
      user?.role === 'operator' ? (user.trialWhatsAppSendsRemaining ?? 0) : 0;

    if (trialLeft > 0) {
      console.log('✅ [Firestore] Operator trial sends remaining:', userId, trialLeft);
      return {
        hasAccess: true,
        subscription: subscription ?? null,
        reason: 'trial_sends',
        trialSendsRemaining: trialLeft,
      };
    }

    if (!subscription) {
      console.log('❌ [Firestore] No subscription found for user:', userId);
      return { hasAccess: false, subscription: null, reason: 'no_subscription' };
    }

    if (subscription.status !== 'active') {
      console.log('❌ [Firestore] Subscription not active for user:', userId);
      return { hasAccess: false, subscription, reason: 'subscription_inactive' };
    }

    console.log('❌ [Firestore] Subscription expired and grace period ended:', userId);
    return { hasAccess: false, subscription, reason: 'expired' };
  } catch (error) {
    console.error('❌ [Firestore] Error checking user access:', error);
    throw new Error(`Failed to check user access: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/** Tras un envío WhatsApp exitoso al médico: descuenta un envío de prueba si el acceso era solo por trial */
export async function consumeTrialWhatsAppSendIfOnTrial(userId: string): Promise<void> {
  const access = await checkUserAccess(userId);
  if (access.reason !== 'trial_sends') return;

  const db = getFirestoreAdmin();
  const ref = db.collection('users').doc(userId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    const data = snap.data() as User;
    if (data.role !== 'operator') return;
    const n = data.trialWhatsAppSendsRemaining ?? 0;
    if (n < 1) return;
    tx.update(ref, {
      trialWhatsAppSendsRemaining: n - 1,
      updatedAt: new Date(),
    });
  });
}

// Get all subscriptions (admin)
export async function getAllSubscriptions(): Promise<Subscription[]> {
  try {
    const db = getFirestoreAdmin();
    const snapshot = await db.collection('subscriptions')
      .orderBy('createdAt', 'desc')
      .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Subscription));
  } catch (error) {
    console.error('❌ [Firestore] Error getting all subscriptions:', error);
    throw new Error(`Failed to get subscriptions: ${error instanceof Error ? error.message : 'Unknown'}`);
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

// ========================================
// DATA DELETION (GDPR / Meta)
// ========================================

export async function createDataDeletionRequest(metaUserId: string, confirmationCode: string): Promise<string> {
  const db = getFirestoreAdmin();
  const docRef = await db.collection('data_deletion_requests').add({
    metaUserId,
    confirmationCode,
    status: 'pending',
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
}

export async function getDataDeletionRequestByCode(code: string): Promise<DataDeletionRequest | null> {
  const db = getFirestoreAdmin();
  const snapshot = await db.collection('data_deletion_requests')
    .where('confirmationCode', '==', code)
    .limit(1)
    .get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as DataDeletionRequest;
}

export async function updateDataDeletionRequest(id: string, data: Partial<DataDeletionRequest>): Promise<void> {
  const db = getFirestoreAdmin();
  await db.collection('data_deletion_requests').doc(id).update(data);
}

/** Busca usuarios por teléfono normalizado (para GDPR - Meta puede enviar phone como user_id) */
export async function getUsersByPhone(phone: string): Promise<User[]> {
  const normalized = normalizePhoneForMatch(phone);
  if (!normalized || normalized.length < 10) return [];
  const db = getFirestoreAdmin();
  const usersSnapshot = await db.collection('users').get();
  const matches: User[] = [];
  usersSnapshot.forEach((doc) => {
    const data = doc.data();
    const userPhone = data.phone || data.whatsappPhone || '';
    if (userPhone && normalizePhoneForMatch(userPhone) === normalized) {
      matches.push({ id: doc.id, ...data } as User);
    }
  });
  return matches;
}

/** Registra contacto de WhatsApp para mapeo GDPR (phone puede coincidir con user_id de Meta) */
export async function upsertWhatsAppContact(phone: string): Promise<void> {
  const db = getFirestoreAdmin();
  const normalized = normalizePhoneForMatch(phone);
  if (!normalized) return;
  const docId = `wa_${normalized}`;
  await db.collection('whatsapp_contacts').doc(docId).set({
    phone: normalized,
    lastReceivedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}

// ========================================
// USER PREFERENCES
// ========================================

export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  const db = getFirestoreAdmin();
  const doc = await db.collection('user_preferences').doc(userId).get();
  if (!doc.exists) return null;
  return { userId: doc.id, ...doc.data() } as UserPreferences;
}

export async function setUserPreferences(userId: string, prefs: Partial<Omit<UserPreferences, 'userId' | 'updatedAt'>>): Promise<void> {
  const db = getFirestoreAdmin();
  const existing = await getUserPreferences(userId);
  const defaults: Omit<UserPreferences, 'userId' | 'updatedAt'> = {
    notifications: { email: true, whatsapp: false, studyReady: true },
    language: 'es',
  };
  const merged = {
    ...defaults,
    ...(existing ? { notifications: existing.notifications, language: existing.language } : {}),
    ...prefs,
    notifications: { ...defaults.notifications, ...existing?.notifications, ...prefs?.notifications },
    updatedAt: new Date().toISOString(),
  };
  await db.collection('user_preferences').doc(userId).set({ userId, ...merged }, { merge: true });
}