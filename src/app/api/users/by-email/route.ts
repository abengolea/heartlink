import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/firestore';
import { getAuthenticatedUser } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  console.log('📧 [API] Getting user by email...');
  
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const url = new URL(request.url);
    const email = url.searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    // Solo puede consultar su propio email
    if (email !== authUser.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    console.log('🔍 [API] Searching for user with email:', email);
    
    const user = await getUserByEmail(email);
    
    if (!user) {
      console.log('❌ [API] User not found with email:', email);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('✅ [API] User found:', user.id);
    
    return NextResponse.json({
      success: true,
      user: user
    });

  } catch (error) {
    console.error('❌ [API] Error getting user by email:', error);
    return NextResponse.json(
      {
        error: 'Failed to get user',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}