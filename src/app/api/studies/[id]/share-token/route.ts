import { NextRequest, NextResponse } from 'next/server';
import { getStudyById, updateStudy, getPatientById, getUserById } from '@/lib/firestore';
import { getAuthenticatedUser } from '@/lib/api-auth';
import { studyReadableByUser } from '@/lib/study-access';
import { randomBytes } from 'crypto';

/**
 * GET: Obtiene o genera el token de compartir para un estudio.
 * Incluye metadata (paciente, médico) en la URL para enlaces más descriptivos.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const study = await getStudyById(id);
    if (!study) {
      return NextResponse.json({ error: 'Estudio no encontrado' }, { status: 404 });
    }

    if (!(await studyReadableByUser(authUser, study))) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    let shareToken = study.shareToken;
    if (!shareToken) {
      shareToken = randomBytes(32).toString('hex');
      await updateStudy(id, { shareToken });
    }

    // Obtener paciente y médico para metadata en la URL
    const patientIdRaw = study.patientId;
    const studyWithDoctor = study as { requestingDoctorId?: string };
    let patientName = '';
    let doctorName = '';
    let requesterId: string | undefined;
    if (typeof patientIdRaw === 'object' && patientIdRaw !== null && 'name' in patientIdRaw) {
      patientName = (patientIdRaw as { name?: string }).name || '';
      const reqId = (patientIdRaw as { requesterId?: string | { id?: string } }).requesterId;
      requesterId = typeof reqId === 'string' ? reqId : (reqId as { id?: string })?.id;
      if (requesterId) {
        const doctor = await getUserById(requesterId);
        doctorName = doctor?.name || '';
      }
    } else {
      const pid = typeof patientIdRaw === 'string' ? patientIdRaw : (patientIdRaw as { id?: string })?.id;
      if (pid) {
        const patient = await getPatientById(pid);
        if (patient) {
          patientName = patient.name || '';
          const reqId = patient.requesterId;
          requesterId = typeof reqId === 'string' ? reqId : (reqId as { id?: string })?.id;
          if (requesterId) {
            const doctor = await getUserById(requesterId);
            doctorName = doctor?.name || '';
          }
        }
      }
    }
    // Migrar estudios antiguos: guardar requestingDoctorId si falta
    if (requesterId && !studyWithDoctor.requestingDoctorId) {
      await updateStudy(id, { requestingDoctorId: requesterId });
    }

    const PRODUCTION_URL = 'https://heartlink--heartlink-f4ftq.us-central1.hosted.app';
    const baseUrl = process.env.NEXT_PUBLIC_PUBLIC_SHARE_BASE_URL || PRODUCTION_URL;
    const base = `${baseUrl.replace(/\/$/, '')}/public/study/${id}`;
    const searchParams = new URLSearchParams({ token: shareToken });
    if (patientName) searchParams.set('paciente', patientName);
    if (doctorName) searchParams.set('medico', doctorName);
    const publicUrl = `${base}?${searchParams.toString()}`;

    return NextResponse.json({ shareToken, publicUrl });
  } catch (error) {
    console.error('Error generating share token:', error);
    return NextResponse.json(
      { error: 'Error al generar el enlace' },
      { status: 500 }
    );
  }
}
