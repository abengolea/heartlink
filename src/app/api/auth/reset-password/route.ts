import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getUserByEmail } from '@/lib/firestore';
import { initializeFirebaseAdmin } from '@/lib/firebase-admin-v4';

export async function POST(request: NextRequest) {
  console.log('🔑 [Reset API] Processing password reset request...');
  
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    console.log('🔍 [Reset API] Checking if user exists:', email);
    
    // Check if user exists in Firestore
    const dbUser = await getUserByEmail(email);
    if (!dbUser) {
      // Don't reveal if user exists or not for security
      console.log('❌ [Reset API] User not found in Firestore:', email);
      return NextResponse.json({
        success: true,
        message: 'If the email exists in our system, a password reset link has been sent.'
      });
    }

    console.log('✅ [Reset API] User found in Firestore:', dbUser.id);

    // Try to send password reset email via Firebase Auth
    const app = initializeFirebaseAdmin();
    const auth = getAuth(app);

    try {
      // Check if user exists in Firebase Auth
      const firebaseUser = await auth.getUserByEmail(email);
      console.log('✅ [Reset API] User found in Firebase Auth:', firebaseUser.uid);

      // Generate password reset link
      const resetLink = await auth.generatePasswordResetLink(email, {
        url: `${process.env.NEXT_PUBLIC_APP_URL}`, // Redirect back to login after reset
      });

      console.log('✅ [Reset API] Password reset link generated');

      // In a real app, you would send this via email
      // For now, we'll return it in the response for testing
      return NextResponse.json({
        success: true,
        message: 'Password reset link has been sent to your email.',
        // In production, remove this line and send via email instead
        resetLink: resetLink,
        instructions: 'Copy this link and open it in your browser to reset your password.'
      });

    } catch (authError: any) {
      console.error('❌ [Reset API] Error with Firebase Auth:', authError);
      
      if (authError.code === 'auth/user-not-found') {
        console.log('❌ [Reset API] User not found in Firebase Auth:', email);
        // Don't reveal if user exists or not
        return NextResponse.json({
          success: true,
          message: 'If the email exists in our system, a password reset link has been sent.'
        });
      }

      return NextResponse.json(
        { error: 'Failed to process password reset request' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ [Reset API] Unexpected error:', error);
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
    message: 'Password Reset Endpoint',
    usage: 'POST with { email }',
    description: 'Sends password reset link to user email'
  });
}