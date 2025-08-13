import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail } from '@/lib/firestore';

export async function POST(request: NextRequest) {
  console.log('🎭 [Demo API] Creating demo user...');
  
  try {
    const email = 'abengolea1@gmail.com';
    
    // Check if user already exists
    try {
      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        console.log('✅ [Demo API] Demo user already exists:', existingUser.id);
        return NextResponse.json({
          success: true,
          message: 'Demo user already exists',
          user: existingUser
        });
      }
    } catch (error) {
      // User doesn't exist, continue with creation
      console.log('ℹ️ [Demo API] Demo user does not exist, creating...');
    }

    // Create demo user
    const demoUserData = {
      name: 'Dr. Abel Bengolea',
      email: email,
      role: 'medico_operador',
      specialty: 'Cardiología',
      status: 'active',
      subscriptionStatus: 'inactive', // No subscription initially
      phone: '+54 9 336 451-3355',
      hospital: 'Hospital Demo',
      licenseNumber: 'MP12345',
      title: 'Dr.',
    };

    console.log('👤 [Demo API] Creating demo user with data:', demoUserData);
    
    const userId = await createUser(demoUserData);
    
    console.log('✅ [Demo API] Demo user created successfully with ID:', userId);
    
    return NextResponse.json({
      success: true,
      message: 'Demo user created successfully',
      userId: userId,
      user: {
        id: userId,
        ...demoUserData
      }
    });

  } catch (error) {
    console.error('❌ [Demo API] Error creating demo user:', error);
    return NextResponse.json(
      {
        error: 'Failed to create demo user',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  console.log('🎭 [Demo API] Getting demo user info...');
  
  try {
    const email = 'abengolea1@gmail.com';
    const user = await getUserByEmail(email);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Demo user not found. Create it first with POST /api/users/demo' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      user: user,
      instructions: 'This is the demo user for testing subscriptions'
    });

  } catch (error) {
    console.error('❌ [Demo API] Error getting demo user:', error);
    return NextResponse.json(
      {
        error: 'Failed to get demo user',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}