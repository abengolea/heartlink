/**
 * WhatsApp Handler - Flujo completo: video, paciente, médico solicitante
 */

import { WhatsAppService } from './whatsapp';
import { uploadVideoFromBuffer } from './firebase';
import {
  getAllPatients,
  getAllUsers,
  getDoctorsByOperator,
  getOperatorByWhatsAppPhone,
  checkUserAccess,
  generateOrGetShareTokenAndUrl,
  findOrCreatePatient,
} from '@/lib/firestore';
import { studyUploadFlow, StudyUploadFlowInput } from '@/ai/flows/study-upload-flow';
import { v4 as uuidv4 } from 'uuid';

const DEV_MODE = process.env.WHATSAPP_DEV_MODE === 'true';

export interface WhatsAppHandlerPayload {
  messageId: string;
  from: string;
  contactName: string;
  message: { type?: string; text?: { body?: string }; video?: { id: string }; interactive?: { list_reply?: { id: string } }; [key: string]: unknown };
  timestamp: string;
}

const studySessions = new Map<string, {
  videoUrl?: string;
  patientId?: string;
  pendingPatientName?: string;
  requestingDoctorId?: string;
  operatorId?: string;
  step: 'waiting_patient' | 'waiting_patient_name' | 'waiting_doctor' | 'completed';
  sessionId: string;
}>();

/** Wrapper para uso desde /api/whatsapp/incoming (NotificasHub reenvía aquí) */
export async function handleIncomingMessage(from: string, message: WhatsAppHandlerPayload['message']): Promise<void> {
  const payload: WhatsAppHandlerPayload = {
    messageId: (message as { id?: string })?.id ?? `incoming-${Date.now()}`,
    from: String(from),
    contactName: 'Unknown',
    message,
    timestamp: String((message as { timestamp?: string })?.timestamp ?? Date.now()),
  };
  return handleWhatsAppMessage(payload);
}

export async function handleWhatsAppMessage(data: WhatsAppHandlerPayload): Promise<void> {
  const { from, message, contactName } = data;
  const msgType = message?.type ?? 'text';

  console.log(`[WhatsApp Handler] Procesando ${msgType} de ${contactName} (${from})`);

  try {
    switch (msgType) {
      case 'video':
        await handleVideoMessage(from, message, contactName);
        break;
      case 'text':
        await handleTextMessage(from, message, contactName);
        break;
      case 'interactive':
        await handleInteractiveMessage(from, message, contactName);
        break;
      default:
        await WhatsAppService.sendTextMessage(
          from,
          '❌ Envía un video del estudio para comenzar.'
        );
    }
  } catch (error) {
    console.error('[WhatsApp Handler] Error:', error);
    await WhatsAppService.sendTextMessage(
      from,
      '❌ Error procesando tu mensaje. Intenta nuevamente.'
    );
  }
}

async function handleVideoMessage(from: string, message: { video?: { id: string } }, contactName: string): Promise<void> {
  console.log('[WhatsApp Handler] handleVideoMessage - video id:', message?.video?.id);
  if (!message?.video?.id) {
    console.error('[WhatsApp Handler] Video sin id:', JSON.stringify(message));
    await WhatsAppService.sendTextMessage(from, '❌ No se pudo obtener el video.');
    return;
  }

  if (!DEV_MODE) {
    const operator = await getOperatorByWhatsAppPhone(from);
    if (!operator) {
      await WhatsAppService.sendTextMessage(
        from,
        '❌ Este número no está registrado como operador. Contacta al administrador.'
      );
      return;
    }
    const accessResult = operator.role === 'admin'
      ? { hasAccess: true }
      : await checkUserAccess(operator.id);
    if (!accessResult.hasAccess) {
      await WhatsAppService.sendTextMessage(
        from,
        '❌ Necesitas licencia activa para subir estudios por WhatsApp.'
      );
      return;
    }
  }

  await WhatsAppService.sendTextMessage(from, '🎥 Video recibido. Procesando...');

  const videoBuffer = await WhatsAppService.downloadMedia(message.video.id);
  if (!videoBuffer) {
    await WhatsAppService.sendTextMessage(from, '❌ No se pudo descargar el video.');
    return;
  }

  const videoUrl = await uploadVideoFromBuffer(videoBuffer, `whatsapp-${Date.now()}.mp4`);
  const operatorId = DEV_MODE ? undefined : (await getOperatorByWhatsAppPhone(from))?.id;

  const sessionId = uuidv4();
  studySessions.set(from, {
    videoUrl,
    operatorId,
    step: 'waiting_patient',
    sessionId,
  });

  await sendPatientSelection(from, operatorId);
}

async function handleTextMessage(from: string, message: { text?: { body?: string } }, contactName: string): Promise<void> {
  const text = (message?.text?.body ?? '').toLowerCase().trim();

  if (text === 'hola' || text === 'hello' || text === 'hi') {
    await WhatsAppService.sendTextMessage(
      from,
      `¡Hola ${contactName}! 👋\n\nEnvía un video del estudio para comenzar.`
    );
    return;
  }
  if (text === 'ayuda' || text === 'help') {
    await WhatsAppService.sendTextMessage(
      from,
      '📖 *Ayuda*\n\n1. Envía un video del estudio\n2. Selecciona paciente\n3. Selecciona médico solicitante\n4. ¡Listo!\n\n"cancelar" para cancelar.'
    );
    return;
  }
  if (text === 'cancelar' || text === 'cancel') {
    studySessions.delete(from);
    await WhatsAppService.sendTextMessage(from, '❌ Cancelado.');
    return;
  }

  const session = studySessions.get(from);
  if (session?.step === 'waiting_patient_name' && text) {
    session.pendingPatientName = text.trim();
    session.step = 'waiting_doctor';
    studySessions.set(from, session);
    await sendDoctorSelection(from, session.operatorId);
    return;
  }

  await WhatsAppService.sendTextMessage(
    from,
    '🤔 Envía un video para crear un estudio, o "ayuda" para más información.'
  );
}

async function handleInteractiveMessage(from: string, message: { interactive?: { list_reply?: { id: string } } }, contactName: string): Promise<void> {
  const session = studySessions.get(from);
  if (!session) {
    await WhatsAppService.sendTextMessage(from, '❌ No hay sesión activa. Envía un video para comenzar.');
    return;
  }

  const selectedId = message?.interactive?.list_reply?.id;
  if (!selectedId) return;

  if (session.step === 'waiting_patient') {
    if (selectedId === 'new_patient') {
      session.step = 'waiting_patient_name';
      studySessions.set(from, session);
      await WhatsAppService.sendTextMessage(from, '👤 Escribe el nombre completo del paciente:');
      return;
    }
    session.patientId = selectedId;
    session.step = 'waiting_doctor';
    studySessions.set(from, session);
    await sendDoctorSelection(from, session.operatorId);
  } else if (session.step === 'waiting_doctor') {
    session.requestingDoctorId = selectedId;
    session.step = 'completed';
    studySessions.set(from, session);
    await createStudyFromWhatsApp(from, session, contactName);
  }
}

async function sendPatientSelection(from: string, operatorId?: string): Promise<void> {
  let patients = await getAllPatients();
  if (operatorId) {
    const doctorIds = (await getDoctorsByOperator(operatorId)).map((d) => d.id);
    patients = patients.filter((p) => doctorIds.includes(p.requesterId));
  }

  const listItems = patients.slice(0, 10).map((p) => ({
    id: p.id,
    title: p.name,
    description: `DNI: ${p.dni || 'N/A'}`,
  }));
  listItems.push({ id: 'new_patient', title: '➕ Crear nuevo paciente', description: 'Si no está en la lista' });

  await WhatsAppService.sendListMessage(from, '👤 Paciente', 'Selecciona el paciente:', listItems);
}

async function sendDoctorSelection(from: string, operatorId?: string): Promise<void> {
  const users = operatorId
    ? await getDoctorsByOperator(operatorId)
    : (await getAllUsers()).filter((u) => u.role === 'solicitante' || u.role === 'medico_solicitante');

  const listItems = users.slice(0, 10).map((u) => ({
    id: u.id,
    title: u.name,
    description: u.specialty || 'Médico',
  }));

  if (listItems.length === 0) {
    await WhatsAppService.sendTextMessage(
      from,
      '❌ No hay médicos solicitantes configurados. Contacta al administrador.'
    );
    return;
  }

  await WhatsAppService.sendListMessage(from, '👨‍⚕️ Médico solicitante', 'Selecciona el médico:', listItems);
}

async function createStudyFromWhatsApp(from: string, session: { videoUrl?: string; patientId?: string; pendingPatientName?: string; requestingDoctorId?: string }, contactName: string): Promise<void> {
  await WhatsAppService.sendTextMessage(from, '⏳ Creando estudio...');

  const [patients, users] = await Promise.all([getAllPatients(), getAllUsers()]);

  let patientName: string;
  let requestingDoctor = users.find((u) => u.id === session.requestingDoctorId);

  if (session.pendingPatientName) {
    patientName = session.pendingPatientName;
    const requesterId = requestingDoctor?.id ?? users[0]?.id ?? '';
    const patient = await findOrCreatePatient(patientName, requesterId);
    session.patientId = patient.id;
  } else {
    const patient = patients.find((p) => p.id === session.patientId);
    if (!patient) {
      await WhatsAppService.sendTextMessage(from, '❌ Paciente no encontrado.');
      return;
    }
    patientName = patient.name;
  }

  if (!requestingDoctor) {
    await WhatsAppService.sendTextMessage(from, '❌ Médico no encontrado.');
    return;
  }

  const input: StudyUploadFlowInput = {
    videoDataUri: session.videoUrl!,
    patientName,
    requestingDoctorName: requestingDoctor.name,
    description: `Subido por WhatsApp - ${contactName}`,
  };

  const result = await studyUploadFlow(input);
  const { publicUrl } = await generateOrGetShareTokenAndUrl(result.studyId);

  await WhatsAppService.sendTextMessage(
    from,
    `✅ *Estudio creado*\n\n📋 ID: ${result.studyId}\n👤 Paciente: ${patientName}\n👨‍⚕️ Médico: ${requestingDoctor.name}\n\n🔗 ${publicUrl}`
  );

  if (requestingDoctor.phone?.trim()) {
    await WhatsAppService.sendTextMessage(
      requestingDoctor.phone,
      `📋 *HeartLink - Estudio listo*\n\nEstudio de *${patientName}* completado.\n\n🔗 ${publicUrl}`
    ).catch(() => {});
  }

  studySessions.delete(from);
}
