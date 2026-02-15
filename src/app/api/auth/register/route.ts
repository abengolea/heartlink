import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getUserByEmail, createUser, addDoctorToOperator } from '@/lib/firestore';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin-v4';

export async function POST(request: NextRequest) {
  console.log('👤 [Auth API] Registering new doctor (self-registration)...');
  
  try {
    const body = await request.json();
    console.log('📝 [Auth API] Request body received:', { email: body.email, hasPassword: !!body.password, name: body.name, operatorId: body.operatorId });
    
    const { email, password, name, operatorId } = body;

    if (!email || !password || !name) {
      console.log('❌ [Auth API] Missing required fields');
      return NextResponse.json(
        { error: 'Email, password and name are required' },
        { status: 400 }
      );
    }

    // Verificar si ya existe en Firestore (email duplicado)
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      console.log('⚠️ [Auth API] Email already registered in Firestore:', email);
      return NextResponse.json(
        { error: 'Ya existe una cuenta con este email. Intenta iniciar sesión.' },
        { status: 409 }
      );
    }

    // Crear usuario en Firebase Authentication primero
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
          { error: 'Ya existe una cuenta con este email. Intenta iniciar sesión.' },
          { status: 409 }
        );
      } catch (userNotFoundError: any) {
        // User doesn't exist in Firebase Auth, continue with creation
        if (userNotFoundError.code === 'auth/user-not-found') {
          console.log('ℹ️ [Auth API] User not found in Firebase Auth, proceeding with creation');
        } else {
          console.error('❌ [Auth API] Unexpected error checking user:', userNotFoundError);
          return NextResponse.json(
            { error: 'Error al verificar si el usuario ya existe. Por favor, intenta nuevamente.', details: userNotFoundError.message },
            { status: 500 }
          );
        }
      }

      console.log('👤 [Auth API] Creating user in Firebase Auth...');
      const userRecord = await auth.createUser({
        email: email,
        password: password,
        displayName: name,
        emailVerified: false, // El médico se auto-registra
      });

      console.log('✅ [Auth API] User created in Firebase Auth:', userRecord.uid);

      // Crear perfil en Firestore con estado pendiente de aprobación
      const dbUserId = await createUser({
        name: name.trim(),
        email: email,
        role: 'medico_solicitante',
        status: 'pending_approval', // El admin debe autorizar
      });

      console.log('✅ [Auth API] User profile created in Firestore (pending approval):', dbUserId);

      // Si el solicitante indicó con qué operador trabaja, crear el vínculo
      if (operatorId) {
        try {
          await addDoctorToOperator(operatorId, dbUserId);
          console.log('✅ [Auth API] Linked solicitante to operator:', operatorId);
        } catch (linkError) {
          console.warn('⚠️ [Auth API] Could not link to operator (non-fatal):', linkError);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Cuenta creada exitosamente. Un administrador debe autorizar tu acceso.',
        uid: userRecord.uid,
        email: userRecord.email,
        name: userRecord.displayName,
        dbUser: {
          id: dbUserId,
          name: name,
          role: 'medico_solicitante',
          status: 'pending_approval'
        }
      });

    } catch (authError: any) {
      console.error('❌ [Auth API] Error creating user in Firebase Auth:', authError);
      
      let errorMessage = 'Error al crear la cuenta. Por favor, intenta nuevamente.';
      if (authError.code === 'auth/email-already-exists') {
        errorMessage = 'Ya existe una cuenta con este email. ¿Intentas iniciar sesión?';
      } else if (authError.code === 'auth/invalid-email') {
        errorMessage = 'El formato del email no es válido.';
      } else if (authError.code === 'auth/weak-password') {
        errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
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