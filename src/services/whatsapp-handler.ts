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
  getSolicitanteByPhone,
  checkUserAccess,
  consumeTrialWhatsAppSendIfOnTrial,
  generateOrGetShareTokenAndUrl,
  findOrCreatePatient,
  createUser,
  addDoctorToOperator,
} from '@/lib/firestore';
import { logWhatsAppSend } from '@/lib/notificashub';
import { studyUploadFlow, StudyUploadFlowInput } from '@/ai/flows/study-upload-flow';
import { toWhatsAppFormat } from '@/lib/phone-format';
import { MIN_VIDEO_DURATION_SECONDS } from '@/lib/upload-constants';
import { v4 as uuidv4 } from 'uuid';

const DEV_MODE = process.env.WHATSAPP_DEV_MODE === 'true';

/** Límite de tamaño de video de WhatsApp Cloud API (envío como multimedia) */
const WHATSAPP_VIDEO_MAX_BYTES = 16 * 1024 * 1024;

function heartlinkBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://heartlink--heartlink-f4ftq.us-central1.hosted.app'
  ).replace(/\/$/, '');
}

function subscriptionPageUrl(): string {
  return `${heartlinkBaseUrl()}/dashboard/subscription`;
}

function studiesUploadUrl(): string {
  return `${heartlinkBaseUrl()}/dashboard/studies/upload`;
}

/** Mensaje cuando el video dura menos del mínimo exigido (siempre con respuesta clara al operador). */
function messageVideoTooShortWhatsApp(): string {
  return (
    `❌ Este video *no alcanza la duración mínima*.\n\n` +
    `Necesitamos una grabación *superior a 1 minuto* (más de 60 segundos).\n\n` +
    `Enviá de nuevo un video más largo o subilo desde la app:\n${studiesUploadUrl()}`
  );
}

/** Respuesta por WhatsApp cuando el operador no puede usar el flujo (sin plan / sin envíos de prueba). */
function messageForWhatsAppAccessDenied(reason?: string): string {
  const url = subscriptionPageUrl();
  switch (reason) {
    case 'no_subscription':
      return (
        '⚠️ *Límite de envíos gratis alcanzado*\n\n' +
        'Ya usaste todos los envíos de prueba por WhatsApp al médico solicitante. ' +
        'Para seguir enviando estudios desde acá, ingresá a HeartLink y contratá un plan:\n\n' +
        `🔗 ${url}\n\n` +
        'Iniciá sesión con tu cuenta en esa página para ver precios y activar el envío.'
      );
    case 'expired':
      return (
        '⚠️ *Suscripción vencida*\n\n' +
        'Tu plan ya no está activo. Renová tu plan en HeartLink para volver a enviar por WhatsApp:\n\n' +
        `🔗 ${url}`
      );
    case 'access_blocked':
      return (
        '⚠️ *Acceso suspendido*\n\n' +
        'Tu cuenta tiene el acceso bloqueado. Regularizá la situación o contactá soporte desde la web:\n\n' +
        `🔗 ${url}`
      );
    case 'subscription_inactive':
      return (
        '⚠️ *Suscripción inactiva*\n\n' +
        'Activá o renová tu plan en HeartLink para seguir usando el envío por WhatsApp:\n\n' +
        `🔗 ${url}`
      );
    default:
      return (
        '❌ Necesitás suscripción activa o envíos de prueba disponibles para subir estudios por WhatsApp.\n\n' +
        'Revisá tu plan acá:\n\n' +
        `🔗 ${url}`
      );
  }
}

function parseOptionalMaxVideoDurationSeconds(): number | null {
  const raw = process.env.WHATSAPP_VIDEO_MAX_DURATION_SECONDS?.trim();
  if (!raw) return null;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

/** Duración en segundos desde el webhook (Meta suele enviar `seconds`; algunos routers usan `duration`). */
function videoDurationSecondsFromMessage(video: { seconds?: unknown; duration?: unknown }): number | null {
  const s = video.seconds ?? video.duration;
  if (s == null || s === '') return null;
  const n = typeof s === 'string' ? parseFloat(s) : Number(s);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

/** Contacto compartido - estructura del webhook de Meta (puede variar según versión/router) */
interface IncomingContact {
  name?: { formatted_name?: string; first_name?: string };
  phones?: Array<{ phone?: string; wa_id?: string; type?: string }>;
  /** Algunos payloads incluyen vCard en lugar de phones */
  vcard?: string;
  /** Fallback: teléfono a nivel raíz (algunos routers) */
  phone?: string;
  wa_id?: string;
}

export interface WhatsAppHandlerPayload {
  messageId: string;
  from: string;
  contactName: string;
  message: {
    type?: string;
    text?: { body?: string };
    video?: { id: string; seconds?: number; duration?: number; file_size?: number };
    interactive?: { list_reply?: { id: string } };
    contacts?: IncomingContact[];
    [key: string]: unknown;
  };
  timestamp: string;
}

const studySessions = new Map<string, {
  videoUrl?: string;
  patientId?: string;
  pendingPatientName?: string;
  requestingDoctorId?: string;
  /** Teléfono del médico cuando viene de contacto compartido o escrito - evita depender de BD para el envío */
  requestingDoctorPhone?: string;
  operatorId?: string;
  step: 'waiting_patient' | 'waiting_patient_name' | 'waiting_doctor' | 'waiting_doctor_phone' | 'completed';
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

export class UserNotRegisteredError extends Error {
  constructor(phone: string) {
    super(`User not registered: ${phone}`);
    this.name = 'UserNotRegisteredError';
  }
}

export async function handleWhatsAppMessage(data: WhatsAppHandlerPayload): Promise<void> {
  const { from, message, contactName } = data;
  const msgType = message?.type ?? 'text';

  console.log(`[WhatsApp Handler] Procesando ${msgType} de ${contactName} (${from})`);

  // Verificar que el remitente sea un usuario registrado (operador/admin)
  if (!DEV_MODE) {
    const operator = await getOperatorByWhatsAppPhone(from);
    if (!operator) {
      throw new UserNotRegisteredError(from);
    }
  }

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
      case 'contacts':
        await handleContactsMessage(from, message, contactName);
        break;
      default:
        await WhatsAppService.sendTextMessage(
          from,
          '❌ Enviá un video del estudio (*superior a 1 minuto*) para comenzar.'
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

async function handleVideoMessage(
  from: string,
  message: { video?: { id: string; seconds?: number; duration?: number; file_size?: number } },
  contactName: string
): Promise<void> {
  const videoMeta = message?.video;
  console.log('[WhatsApp Handler] handleVideoMessage - video id:', videoMeta?.id);
  if (!videoMeta?.id) {
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
    if (operator.role !== 'admin') {
      const accessResult = await checkUserAccess(operator.id);
      if (!accessResult.hasAccess) {
        await WhatsAppService.sendTextMessage(
          from,
          messageForWhatsAppAccessDenied(accessResult.reason)
        );
        return;
      }
    }
  }

  const maxDurationSec = parseOptionalMaxVideoDurationSeconds();
  const durationSecs = videoDurationSecondsFromMessage(videoMeta);
  if (maxDurationSec != null && durationSecs != null && durationSecs > maxDurationSec) {
    await WhatsAppService.sendTextMessage(
      from,
      `❌ El video supera la duración permitida (${maxDurationSec} s). Enviá uno más corto o subilo desde la app web.`
    );
    return;
  }

  if (durationSecs != null && durationSecs < MIN_VIDEO_DURATION_SECONDS) {
    await WhatsAppService.sendTextMessage(from, messageVideoTooShortWhatsApp());
    return;
  }

  const declaredSize =
    typeof videoMeta.file_size === 'number' && Number.isFinite(videoMeta.file_size)
      ? videoMeta.file_size
      : null;
  if (declaredSize != null && declaredSize > WHATSAPP_VIDEO_MAX_BYTES) {
    await WhatsAppService.sendTextMessage(
      from,
      '❌ El video supera el límite de WhatsApp (16 MB). Comprimí el archivo o subilo desde la app web.'
    );
    return;
  }

  const processingAck =
    durationSecs == null
      ? `🎥 Video recibido. Procesando...\n\n` +
        `ℹ️ *Requisito:* la grabación debe ser *superior a 1 minuto*. ` +
        `Si este envío fuera más corto, tendrás que mandar otro video o usar la web:\n${studiesUploadUrl()}`
      : '🎥 Video recibido. Procesando...';
  await WhatsAppService.sendTextMessage(from, processingAck);

  const videoBuffer = await WhatsAppService.downloadMedia(videoMeta.id);
  if (!videoBuffer) {
    await WhatsAppService.sendTextMessage(from, '❌ No se pudo descargar el video.');
    return;
  }

  if (videoBuffer.length > WHATSAPP_VIDEO_MAX_BYTES) {
    await WhatsAppService.sendTextMessage(
      from,
      '❌ El video supera el límite de WhatsApp (16 MB). Comprimí el archivo o subilo desde la app web.'
    );
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
    const maxDur = parseOptionalMaxVideoDurationSeconds();
    const durHint =
      maxDur != null
        ? ` Duración máxima indicada por tu centro: ${maxDur} s.`
        : '';
    await WhatsAppService.sendTextMessage(
      from,
      `¡Hola ${contactName}! 👋\n\nEnvía un video del estudio para comenzar ` +
        `(grabación *superior a 1 minuto*, máx. 16 MB).${durHint}`
    );
    return;
  }
  if (text === 'ayuda' || text === 'help') {
    await WhatsAppService.sendTextMessage(
      from,
      '📖 *Ayuda*\n\n1. Envía un video del estudio (*superior a 1 minuto*, máx. 16 MB; si aplica, respetá también la duración máxima que te indicó tu centro)\n2. Selecciona paciente\n3. Selecciona médico o comparte su contacto\n4. ¡Listo!\n\n"cancelar" para cancelar.'
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

  if (session?.step === 'waiting_doctor_phone' && text) {
    const phoneDigits = text.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      await WhatsAppService.sendTextMessage(from, '❌ Número inválido. Envíalo con código de país, ej: 5491112345678');
      return;
    }
    const phone = phoneDigits.startsWith('54') ? phoneDigits : `54${phoneDigits}`;
    let solicitante = await getSolicitanteByPhone(phone);
    if (!solicitante) {
      const newId = await createUser({
        name: 'Por completar',
        phone,
        role: 'medico_solicitante',
        status: 'active',
      });
      if (session.operatorId) {
        await addDoctorToOperator(session.operatorId, newId);
      }
      solicitante = { id: newId, name: 'Por completar', phone, role: 'medico_solicitante', status: 'active' };
      await WhatsAppService.sendTextMessage(
        phone,
        `👋 *HeartLink*\n\nUn operador te agregó como médico solicitante. Recibirás los estudios por aquí.\n\nCompleta tu perfil en la app: ${process.env.NEXT_PUBLIC_APP_URL || 'https://heartlink--heartlink-f4ftq.us-central1.hosted.app'}/dashboard`
      ).catch(() => {});
    }
    session.requestingDoctorId = solicitante.id;
    session.requestingDoctorPhone = phone; // Guardar para el envío al médico
    session.step = 'completed';
    studySessions.set(from, session);
    await createStudyFromWhatsApp(from, session, contactName);
    return;
  }

  await WhatsAppService.sendTextMessage(
    from,
    '🤔 Enviá un video (*superior a 1 minuto*) para crear un estudio, o escribí "ayuda".'
  );
}

/** Extrae teléfono de un string vCard (TEL:...) */
function extractPhoneFromVcard(vcard: string): string | undefined {
  const telMatch = vcard.match(/TEL[;:]?\s*([+\d\s\-()]+)/i);
  if (!telMatch?.[1]) return undefined;
  return telMatch[1].replace(/\D/g, '').replace(/^0+/, '') || undefined;
}

/** Extrae teléfono y nombre de un contacto compartido.
 * Soporta: phones[].wa_id/phone (Meta), vcard (TEL:), phone/wa_id a nivel raíz.
 */
function extractPhoneFromContact(contact: IncomingContact): { phone?: string; name?: string } {
  const name = contact?.name?.formatted_name || contact?.name?.first_name || undefined;
  let raw = '';

  const phones = contact?.phones;
  if (phones?.length) {
    const withWaId = phones.find((p) => p?.wa_id);
    raw = withWaId?.wa_id || phones[0]?.phone || '';
  }
  if (!raw && contact?.wa_id) raw = String(contact.wa_id);
  if (!raw && contact?.phone) raw = String(contact.phone);
  if (!raw && contact?.vcard) raw = extractPhoneFromVcard(contact.vcard) || '';

  if (!raw || !String(raw).trim()) return { name };

  const phoneNorm = toWhatsAppFormat(String(raw).trim());
  if (!phoneNorm || phoneNorm.length < 10) {
    console.warn('[WhatsApp] Contacto con número inválido o muy corto:', raw, '→', phoneNorm);
    return { phone: undefined, name };
  }
  console.log('[WhatsApp] Contacto extraído:', raw, '→', phoneNorm);
  return { phone: phoneNorm, name };
}

async function handleContactsMessage(from: string, message: { contacts?: IncomingContact[]; contact?: IncomingContact; [k: string]: unknown }, contactName: string): Promise<void> {
  const session = studySessions.get(from);
  if (session?.step !== 'waiting_doctor_phone') {
    await WhatsAppService.sendTextMessage(
      from,
      '📱 Compartí el contacto cuando te lo pida el sistema (al agregar un médico solicitante). O enviá un video *superior a 1 minuto* para comenzar.'
    );
    return;
  }

  // NotificasHub puede reenviar message tal cual o anidado - soportar varias estructuras
  const msgContacts = message?.contacts ?? (message?.contact ? [message.contact] : []);
  const contactsRaw = Array.isArray(msgContacts) ? msgContacts : msgContacts ? [msgContacts] : [];
  const contacts = contactsRaw.flat().filter(Boolean);

  if (!contacts.length) {
    console.warn('[WhatsApp] Mensaje contacts sin datos:', { hasContacts: !!message?.contacts, hasContact: !!message?.contact, keys: Object.keys(message || {}) });
    await WhatsAppService.sendTextMessage(from, '❌ No se pudo leer el contacto. Intenta compartirlo de nuevo o escribe el número.');
    return;
  }

  const { phone, name } = extractPhoneFromContact(contacts[0] as IncomingContact);
  if (!phone) {
    console.warn('[WhatsApp] Contacto sin número válido:', JSON.stringify(contacts[0]).slice(0, 200));
    await WhatsAppService.sendTextMessage(from, '❌ El contacto no tiene número. Escribe el número manualmente (ej: 5491112345678).');
    return;
  }

  let solicitante = await getSolicitanteByPhone(phone);
  if (!solicitante) {
    const displayName = (name && name.trim()) || 'Por completar';
    const newId = await createUser({
      name: displayName,
      phone,
      role: 'medico_solicitante',
      status: 'active',
    });
    if (session.operatorId) {
      await addDoctorToOperator(session.operatorId, newId);
    }
    solicitante = { id: newId, name: displayName, phone, role: 'medico_solicitante', status: 'active' };
    await WhatsAppService.sendTextMessage(
      phone,
      `👋 *HeartLink*\n\nUn operador te agregó como médico solicitante. Recibirás los estudios por aquí.\n\nCompleta tu perfil en la app: ${process.env.NEXT_PUBLIC_APP_URL || 'https://heartlink--heartlink-f4ftq.us-central1.hosted.app'}/dashboard`
    ).catch(() => {});
  }

  session.requestingDoctorId = solicitante.id;
  session.requestingDoctorPhone = phone; // Guardar para el envío - evita depender de BD
  session.step = 'completed';
  studySessions.set(from, session);
  await createStudyFromWhatsApp(from, session, contactName);
}

async function handleInteractiveMessage(from: string, message: { interactive?: { list_reply?: { id: string } } }, contactName: string): Promise<void> {
  const session = studySessions.get(from);
  if (!session) {
    await WhatsAppService.sendTextMessage(
      from,
      '❌ No hay sesión activa. Enviá un video *superior a 1 minuto* para comenzar.'
    );
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
    if (selectedId === 'add_doctor_by_phone') {
      session.step = 'waiting_doctor_phone';
      studySessions.set(from, session);
      await WhatsAppService.sendTextMessage(
        from,
        '📱 *Agregar médico solicitante*\n\nComparte el contacto del médico (desde tu libreta) o escribe su número con código de país (ej: 5491112345678):'
      );
      return;
    }
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

  const listItems = users.slice(0, 9).map((u) => ({
    id: u.id,
    title: u.name,
    description: u.specialty || u.phone || 'Médico',
  }));

  listItems.push({
    id: 'add_doctor_by_phone',
    title: '➕ Agregar médico por tel',
    description: 'Número de WhatsApp del médico',
  });

  if (listItems.length === 1) {
    const session = studySessions.get(from);
    if (session) {
      session.step = 'waiting_doctor_phone';
      studySessions.set(from, session);
    }
    await WhatsAppService.sendTextMessage(
      from,
      '👨‍⚕️ *Agregar médico solicitante*\n\nNo hay médicos en la lista. Comparte el contacto del médico (desde tu libreta) o escribe su número (ej: 5491112345678):'
    );
    return;
  }

  await WhatsAppService.sendListMessage(from, '👨‍⚕️ Médico solicitante', 'Selecciona el médico o agrega uno:', listItems);
}

async function createStudyFromWhatsApp(
  from: string,
  session: { videoUrl?: string; patientId?: string; pendingPatientName?: string; requestingDoctorId?: string; requestingDoctorPhone?: string; operatorId?: string },
  contactName: string
): Promise<void> {
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
    ...(session.operatorId ? { operatorId: session.operatorId } : {}),
  };

  const result = await studyUploadFlow(input);
  const { publicUrl } = await generateOrGetShareTokenAndUrl(result.studyId);

  await WhatsAppService.sendTextMessage(
    from,
    `✅ *Estudio creado*\n\n📋 ID: ${result.studyId}\n👤 Paciente: ${patientName}\n👨‍⚕️ Médico: ${requestingDoctor.name}\n\n🔗 ${publicUrl}`
  );

  // Priorizar phone de la sesión (contacto compartido/escrito) sobre el de BD - más fiable
  const phoneToSend = session.requestingDoctorPhone || requestingDoctor.phone?.trim();
  if (phoneToSend) {
    const phone = toWhatsAppFormat(phoneToSend);
    if (!phone || phone.length < 10) {
      console.warn('[WhatsApp Handler] Teléfono del médico inválido:', phoneToSend);
    } else {
      const estudioDesc = patientName;
      const sendResult = await WhatsAppService.sendStudyTemplate(
        phone,
        requestingDoctor.name,
        estudioDesc,
        publicUrl
      );
      if (!sendResult.ok) {
        console.warn('[WhatsApp Handler] No se pudo notificar al médico:', phone, sendResult.error);
      } else {
        await logWhatsAppSend({
          to: phone,
          medicoNombre: requestingDoctor.name,
          estudio: estudioDesc,
          link: publicUrl,
          operatorId: session.operatorId,
        });
        if (session.operatorId) {
          await consumeTrialWhatsAppSendIfOnTrial(session.operatorId);
        }
      }
    }
  } else {
    console.warn('[WhatsApp Handler] Médico sin teléfono - no se envía notificación:', requestingDoctor.name, requestingDoctor.id);
  }

  studySessions.delete(from);
}
