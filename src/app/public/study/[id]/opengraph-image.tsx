import { ImageResponse } from 'next/og';

export const alt = 'Estudio médico compartido - HeartLink';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const dynamic = 'force-dynamic';

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let patientName = '';
  let doctorName = '';

  try {
    const { getStudyById, getPatientById, getUserById } = await import('@/lib/firestore');
    const study = await getStudyById(id);
    if (study) {
      const patientIdRaw = study.patientId;
      let patient: { name?: string; requesterId?: string | { id?: string } } | null = null;
      if (typeof patientIdRaw === 'object' && patientIdRaw !== null && 'name' in patientIdRaw) {
        patient = patientIdRaw as { name?: string; requesterId?: string | { id?: string } };
      } else {
        const pid = typeof patientIdRaw === 'string' ? patientIdRaw : (patientIdRaw as { id?: string })?.id;
        patient = pid ? await getPatientById(pid) : null;
      }
      if (patient) patientName = patient.name || '';
      const studyDoctorId = (study as { requestingDoctorId?: string }).requestingDoctorId;
      const reqIdRaw = patient?.requesterId;
      const reqId = studyDoctorId || (typeof reqIdRaw === 'string' ? reqIdRaw : reqIdRaw?.id);
      if (reqId) {
        const doctor = await getUserById(reqId);
        doctorName = doctor?.name || '';
      }
    }
  } catch {
    // Fallback
  }

  const title = patientName && doctorName
    ? `Estudio de ${patientName} | ${doctorName}`
    : patientName
      ? `Estudio de ${patientName}`
      : doctorName
        ? `Estudio | ${doctorName}`
        : 'Estudio Médico Compartido';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          color: 'white',
          fontFamily: 'system-ui, sans-serif',
          padding: 48,
        }}
      >
        <div style={{ fontSize: 28, marginBottom: 16, opacity: 0.9 }}>HeartLink</div>
        <div style={{ fontSize: 42, fontWeight: 700, textAlign: 'center', maxWidth: 900 }}>
          {title}
        </div>
        {patientName && doctorName && (
          <div style={{ fontSize: 24, marginTop: 24, opacity: 0.8 }}>
            Paciente: {patientName} · Médico: {doctorName}
          </div>
        )}
      </div>
    ),
    { ...size }
  );
}
