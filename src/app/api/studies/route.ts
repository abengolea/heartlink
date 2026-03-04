import { NextRequest, NextResponse } from 'next/server';
import { getAllStudies, createStudy } from '@/lib/firestore';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { verifySubscriptionAccess, createAccessControlResponse } from '@/middleware/subscription-access';

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
    if (authUser.dbUser.role !== 'admin') {
      const accessResult = await verifySubscriptionAccess(authUser.dbUser.id);
      if (!accessResult.hasAccess) {
        const res = createAccessControlResponse(accessResult);
        return NextResponse.json(res, { status: 402 });
      }
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