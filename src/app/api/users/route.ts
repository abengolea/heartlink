import { NextResponse } from 'next/server';
import { getAllUsers } from '@/lib/firestore';

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