import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import { getAllStudies, getPatientById } from '@/lib/firestore';

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['admin']);
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (msg === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const all = await getAllStudies();
    const shared = all.filter((s) => s.shareToken);
    const studies = await Promise.all(
      shared.map(async (s) => {
        const patient = s.patientId ? await getPatientById(s.patientId) : null;
        return {
          id: s.id,
          patientName: patient?.name ?? '-',
          studyType: s.description?.slice(0, 30) ?? '-',
          shareToken: s.shareToken,
          createdAt: s.createdAt,
        };
      })
    );
    return NextResponse.json({ studies });
  } catch (error) {
    console.error('Error getting shared studies:', error);
    return NextResponse.json(
      { error: 'Error al obtener estudios compartidos' },
      { status: 500 }
    );
  }
}
