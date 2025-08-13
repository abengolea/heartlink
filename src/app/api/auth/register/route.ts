import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getUserByEmail } from '@/lib/firestore';
import { getFirebaseAdmin } from '@/lib/firebase-admin-v4';

export async function POST(request: NextRequest) {
  console.log('👤 [Auth API] Creating Firebase Auth user...');
  
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    console.log('🔍 [Auth API] Checking if user exists in Firestore:', email);
    
    // Check if user exists in Firestore
    const dbUser = await getUserByEmail(email);
    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found in database. Contact administrator to create your profile first.' },
        { status: 404 }
      );
    }

    console.log('✅ [Auth API] User found in Firestore:', dbUser.id);

    // Create user in Firebase Authentication
    const app = getFirebaseAdmin();
    const auth = getAuth(app);

    try {
      // Check if user already exists in Firebase Auth
      try {
        const existingUser = await auth.getUserByEmail(email);
        console.log('⚠️ [Auth API] User already exists in Firebase Auth:', existingUser.uid);
        return NextResponse.json(
          { error: 'User already exists in Firebase Authentication. Try logging in instead.' },
          { status: 409 }
        );
      } catch (userNotFoundError) {
        // User doesn't exist in Firebase Auth, continue with creation
        console.log('ℹ️ [Auth API] User not found in Firebase Auth, creating...');
      }

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
        { error: errorMessage, code: authError.code },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('❌ [Auth API] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Firebase Auth Registration Endpoint',
    usage: 'POST with { email, password, name }',
    description: 'Creates Firebase Auth user for existing Firestore users'
  });
}