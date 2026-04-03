import { NextRequest, NextResponse } from 'next/server';
import type { Study } from '@/lib/types';
import {
  getAllStudies,
  createStudy,
  getPatientsByRequesterId,
  getPatientsByRequesterIds,
  getDoctorsByOperator,
} from '@/lib/firestore';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { verifySubscriptionAccess, createAccessControlResponse } from '@/middleware/subscription-access';
import {
  studyVisibleToRequesterWithPatientSet,
  studyVisibleToOperator,
} from '@/lib/study-access';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const role = authUser.dbUser.role;
    if (role === 'medico_solicitante' || role === 'solicitante') {
      const [studies, myPatients] = await Promise.all([
        getAllStudies(),
        getPatientsByRequesterId(authUser.dbUser.id),
      ]);
      const myPatientIds = new Set(myPatients.map((p) => p.id));
      return NextResponse.json(
        studies.filter((s) =>
          studyVisibleToRequesterWithPatientSet(s, authUser.dbUser.id, myPatientIds)
        )
      );
    }
    if (role === 'operator') {
      const doctors = await getDoctorsByOperator(authUser.dbUser.id);
      const linked = new Set(doctors.map((d) => d.id));
      const poolPatients =
        linked.size > 0 ? await getPatientsByRequesterIds([...linked]) : [];
      const poolPatientIds = new Set(poolPatients.map((p) => p.id));
      const studies = await getAllStudies();
      return NextResponse.json(
        studies.filter((s) =>
          studyVisibleToOperator(s, authUser.dbUser.id, linked, poolPatientIds)
        )
      );
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
    const studyData = (await request.json()) as Omit<Study, 'id'>;
    if (authUser.dbUser.role === 'operator') {
      studyData.operatorId = authUser.dbUser.id;
    }
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