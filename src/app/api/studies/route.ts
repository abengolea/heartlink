import { NextRequest, NextResponse } from 'next/server';
import { getAllStudies, createStudy } from '@/lib/firestore';
import { getAuthenticatedUser } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const studies = await getAllStudies();
    return NextResponse.json(studies);
  } catch (error) {
    console.error('Error getting studies:', error);
    return NextResponse.json(
      { error: 'Failed to get studies' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const studyData = await request.json();
    const studyId = await createStudy(studyData);
    return NextResponse.json({ id: studyId, success: true });
  } catch (error) {
    console.error('Error creating study:', error);
    return NextResponse.json(
      { error: 'Failed to create study' },
      { status: 500 }
    );
  }
}