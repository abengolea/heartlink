import { NextResponse } from 'next/server';
import { getAllUsers, createUser } from '@/lib/firestore';

export async function GET() {
  try {
    const users = await getAllUsers();
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error getting users:', error);
    return NextResponse.json(
      { error: 'Failed to get users' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const userData = await request.json();
    const userId = await createUser(userData);
    return NextResponse.json({ id: userId, success: true });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}