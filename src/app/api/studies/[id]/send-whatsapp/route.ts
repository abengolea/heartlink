import { NextRequest, NextResponse } from 'next/server';
import { getStudyById, updateStudy, getPatientById, getUserById } from '@/lib/firestore';
import { requireRole } from '@/lib/api-auth';
import { randomBytes } from 'crypto';
import { WhatsAppService } from '@/services/whatsapp';
import { toWhatsAppFormat } from '@/lib/phone-format';

/**
 * POST: Envía el enlace del estudio por WhatsApp a un número.
 * Usa template documento_disponible (funciona fuera de ventana 24h).
 * Body: { to: string } - número (Argentina: +54 9 XXX XXX XXXX o 9 336 451-3355)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Solo operadores pueden enviar estudios por WhatsApp
    await requireRole(request, ['admin', 'operator']);

    const { id } = await params;
    const study = await getStudyById(id);
    if (!study) {
      return NextResponse.json({ error: 'Estudio no encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const rawTo = typeof body?.to === 'string' ? body.to.trim() : '';
    const to = toWhatsAppFormat(rawTo);
    if (!to || to.length < 12) {
      return NextResponse.json(
        { error: 'Número de WhatsApp inválido. Ej: +54 9 336 451-3355 (Argentina)' },
        { status: 400 }
      );
    }

    // Generar shareToken si no existe
    let shareToken = study.shareToken;
    if (!shareToken) {
      shareToken = randomBytes(32).toString('hex');
      await updateStudy(id, { shareToken });
    }

    const PRODUCTION_URL = 'https://heartlink--heartlink-f4ftq.us-central1.hosted.app';
    const baseUrl = process.env.NEXT_PUBLIC_PUBLIC_SHARE_BASE_URL || PRODUCTION_URL;
    const publicUrl = `${baseUrl.replace(/\/$/, '')}/public/study/${id}?token=${shareToken}`;

    // Obtener médico y paciente para el template
    const patientIdRaw = study.patientId;
    const patientId = typeof patientIdRaw === 'string' ? patientIdRaw : (patientIdRaw as { id?: string })?.id;
    const patient = patientId && typeof patientId === 'string' ? await getPatientById(patientId) : null;
    const requesterId = patient?.requesterId;
    const requester = requesterId ? await getUserById(requesterId) : null;
    const medicoNombre = requester?.name || 'Médico';
    const estudioDesc = (study as { description?: string }).description?.trim() || `Estudio - ${patient?.name ?? 'Cardiología'}`;

    const result = await WhatsAppService.sendStudyTemplate(to, medicoNombre, estudioDesc, publicUrl);

    if (!result.ok) {
      console.error('[send-whatsapp] Template send failed:', result.error);
      return NextResponse.json(
        { error: result.error || 'No se pudo enviar por WhatsApp. Verifica que el número sea correcto (ej: +54 9 3364 25-9444).' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Mensaje enviado correctamente' });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      }
      if (error.message === 'FORBIDDEN') {
        return NextResponse.json(
          { error: 'Solo los médicos operadores pueden enviar estudios por WhatsApp' },
          { status: 403 }
        );
      }
    }
    console.error('[send-whatsapp] Error:', error);
    return NextResponse.json(
      { error: 'Error al enviar por WhatsApp' },
      { status: 500 }
    );
  }
}
