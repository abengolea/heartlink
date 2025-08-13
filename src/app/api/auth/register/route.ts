import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getUserByEmail } from '@/lib/firestore';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin-v4';

export async function POST(request: NextRequest) {
  console.log('👤 [Auth API] Creating Firebase Auth user...');
  
  try {
    const body = await request.json();
    console.log('📝 [Auth API] Request body received:', { email: body.email, hasPassword: !!body.password, name: body.name });
    
    const { email, password, name } = body;

    if (!email || !password) {
      console.log('❌ [Auth API] Missing required fields');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    console.log('🔍 [Auth API] Checking if user exists in Firestore:', email);
    
    // Check if user exists in Firestore
    let dbUser;
    try {
      dbUser = await getUserByEmail(email);
      console.log('✅ [Auth API] Firestore query completed, user found:', !!dbUser);
    } catch (firestoreError) {
      console.error('❌ [Auth API] Firestore error:', firestoreError);
      return NextResponse.json(
        { error: 'Database error while checking user' },
        { status: 500 }
      );
    }
    
    if (!dbUser) {
      console.log('❌ [Auth API] User not found in Firestore');
      return NextResponse.json(
        { error: 'User not found in database. Contact administrator to create your profile first.' },
        { status: 404 }
      );
    }

    console.log('✅ [Auth API] User found in Firestore:', dbUser.id);

    // Create user in Firebase Authentication
    console.log('🔥 [Auth API] Initializing Firebase Admin...');
    let app;
    try {
      app = initializeFirebaseAdmin();
      console.log('✅ [Auth API] Firebase Admin initialized successfully');
    } catch (initError) {
      console.error('❌ [Auth API] Firebase Admin initialization error:', initError);
      return NextResponse.json(
        { error: 'Firebase initialization error', details: initError.message },
        { status: 500 }
      );
    }
    
    console.log('🔐 [Auth API] Getting Firebase Auth instance...');
    let auth;
    try {
      auth = getAuth(app);
      console.log('✅ [Auth API] Firebase Auth instance obtained');
    } catch (authInitError) {
      console.error('❌ [Auth API] Firebase Auth initialization error:', authInitError);
      return NextResponse.json(
        { error: 'Firebase Auth initialization error', details: authInitError.message },
        { status: 500 }
      );
    }

    try {
      // Check if user already exists in Firebase Auth
      console.log('🔍 [Auth API] Checking if user exists in Firebase Auth...');
      try {
        const existingUser = await auth.getUserByEmail(email);
        console.log('⚠️ [Auth API] User already exists in Firebase Auth:', existingUser.uid);
        return NextResponse.json(
          { error: 'User already exists in Firebase Authentication. Try logging in instead.' },
          { status: 409 }
        );
      } catch (userNotFoundError: any) {
        // User doesn't exist in Firebase Auth, continue with creation
        if (userNotFoundError.code === 'auth/user-not-found') {
          console.log('ℹ️ [Auth API] User not found in Firebase Auth, proceeding with creation');
        } else {
          console.error('❌ [Auth API] Unexpected error checking user:', userNotFoundError);
          return NextResponse.json(
            { error: 'Error checking existing user', details: userNotFoundError.message },
            { status: 500 }
          );
        }
      }

      console.log('👤 [Auth API] Creating user in Firebase Auth...');
      const userRecord = await auth.createUser({
        email: email,
        password: password,
        displayName: name || dbUser.name,
        emailVerified: true, // Skip email verification for admin-created users
      });

      console.log('✅ [Auth API] User created in Firebase Auth:', userRecord.uid);

      return NextResponse.json({
        success: true,
        message: 'User created successfully in Firebase Authentication',
        uid: userRecord.uid,
        email: userRecord.email,
        name: userRecord.displayName,
        dbUser: {
          id: dbUser.id,
          name: dbUser.name,
          role: dbUser.role,
          specialty: dbUser.specialty
        }
      });

    } catch (authError: any) {
      console.error('❌ [Auth API] Error creating user in Firebase Auth:', authError);
      
      let errorMessage = 'Failed to create user in Firebase Authentication';
      if (authError.code === 'auth/email-already-exists') {
        errorMessage = 'User already exists in Firebase Authentication';
      } else if (authError.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email format';
      } else if (authError.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak (minimum 6 characters)';
      }

      return NextResponse.json(
        { error: errorMessage, code: authError.code, details: authError.message },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('❌ [Auth API] Unexpected error:', error);
    console.error('❌ [Auth API] Error stack:', error.stack);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message || 'Unknown error',
        stack: error.stack?.substring(0, 500) // Limited stack trace
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Firebase Auth Registration Endpoint',
    usage: 'POST with { email, password, name }',
    description: 'Creates Firebase Auth user for existing Firestore users',
    status: 'Ready for testing'
  });
}