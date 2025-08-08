import { WhatsAppService } from './whatsapp';
import { uploadVideoFromBuffer } from './firebase';
import { getAllPatients, getAllUsers } from '@/lib/firestore';
import { studyUploadFlow, StudyUploadFlowInput } from '@/ai/flows/study-upload-flow';
import { v4 as uuidv4 } from 'uuid';

interface WhatsAppMessage {
  messageId: string;
  from: string;
  contactName: string;
  message: any;
  timestamp: string;
}

// In-memory storage for WhatsApp study sessions (in production, use Redis or database)
const studySessions = new Map<string, {
  videoUrl?: string;
  patientId?: string;
  requestingDoctorId?: string;
  step: 'waiting_patient' | 'waiting_doctor' | 'completed';
  sessionId: string;
}>();

export async function handleWhatsAppMessage(data: WhatsAppMessage) {
  const { from, message, contactName } = data;
  
  console.log(`📱 [WhatsApp Handler] Processing ${message.type} from ${contactName} (${from})`);

  try {
    switch (message.type) {
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
          '❌ Tipo de mensaje no soportado. Por favor, envía un video del estudio.'
        );
    }
  } catch (error) {
    console.error('❌ [WhatsApp Handler] Error:', error);
    await WhatsAppService.sendTextMessage(
      from,
      '❌ Error procesando tu mensaje. Por favor, intenta nuevamente.'
    );
  }
}

async function handleVideoMessage(from: string, message: any, contactName: string) {
  console.log(`🎥 [WhatsApp Handler] Processing video from ${contactName}`);
  
  try {
    // Send confirmation message
    await WhatsAppService.sendTextMessage(
      from,
      `🎥 ¡Video recibido, ${contactName}!\n⏳ Procesando y subiendo a Firebase Storage...`
    );

    // Download video from WhatsApp
    const mediaId = message.video.id;
    const videoBuffer = await WhatsAppService.downloadMedia(mediaId);
    
    if (!videoBuffer) {
      throw new Error('No se pudo descargar el video de WhatsApp');
    }

    // Upload video to Firebase Storage
    const fileName = `whatsapp-study-${Date.now()}.mp4`;
    const videoUrl = await uploadVideoFromBuffer(videoBuffer, fileName);
    
    console.log(`✅ [WhatsApp Handler] Video uploaded: ${videoUrl}`);

    // Create session for this user
    const sessionId = uuidv4();
    studySessions.set(from, {
      videoUrl,
      step: 'waiting_patient',
      sessionId
    });

    // Send patient selection
    await sendPatientSelection(from);
    
  } catch (error) {
    console.error('❌ [WhatsApp Handler] Video processing error:', error);
    await WhatsAppService.sendTextMessage(
      from,
      '❌ Error procesando el video. Por favor, intenta nuevamente.'
    );
  }
}

async function handleTextMessage(from: string, message: any, contactName: string) {
  const text = message.text.body.toLowerCase().trim();
  
  // Handle simple commands
  if (text === 'hola' || text === 'hello' || text === 'hi') {
    await WhatsAppService.sendTextMessage(
      from,
      `¡Hola, ${contactName}! 👋\n\n🎥 Para crear un estudio médico, envía un video del estudio cardiológico.\n\n📋 El sistema te guiará para completar los datos del paciente y médico solicitante.`
    );
    return;
  }

  if (text === 'ayuda' || text === 'help') {
    await WhatsAppService.sendTextMessage(
      from,
      `📖 *Ayuda - Sistema de Estudios*\n\n🎥 *Subir estudio:*\n1. Envía un video del estudio\n2. Selecciona el paciente\n3. Selecciona el médico solicitante\n4. ¡Listo! El estudio aparecerá en la web\n\n💬 Comandos:\n• "hola" - Saludo\n• "ayuda" - Esta ayuda\n• "cancelar" - Cancelar proceso actual`
    );
    return;
  }

  if (text === 'cancelar' || text === 'cancel') {
    studySessions.delete(from);
    await WhatsAppService.sendTextMessage(
      from,
      '❌ Proceso cancelado. Puedes enviar un nuevo video cuando quieras.'
    );
    return;
  }

  // Default response for unrecognized text
  await WhatsAppService.sendTextMessage(
    from,
    `🤔 No entiendo ese mensaje.\n\n🎥 Para crear un estudio, envía un video.\n💬 Escribe "ayuda" para más información.`
  );
}

async function handleInteractiveMessage(from: string, message: any, contactName: string) {
  const session = studySessions.get(from);
  
  if (!session) {
    await WhatsAppService.sendTextMessage(
      from,
      '❌ No hay una sesión activa. Envía un video para comenzar.'
    );
    return;
  }

  const listReply = message.interactive?.list_reply;
  if (!listReply) {
    await WhatsAppService.sendTextMessage(
      from,
      '❌ Respuesta no válida. Por favor, selecciona una opción de la lista.'
    );
    return;
  }

  const selectedId = listReply.id;
  
  if (session.step === 'waiting_patient') {
    // Patient selected
    session.patientId = selectedId;
    session.step = 'waiting_doctor';
    studySessions.set(from, session);
    
    await sendDoctorSelection(from);
    
  } else if (session.step === 'waiting_doctor') {
    // Doctor selected - complete the study
    session.requestingDoctorId = selectedId;
    session.step = 'completed';
    studySessions.set(from, session);
    
    await createStudyFromWhatsApp(from, session, contactName);
  }
}

async function sendPatientSelection(from: string) {
  try {
    const patients = await getAllPatients();
    
    const listItems = patients.slice(0, 10).map(patient => ({
      id: patient.id,
      title: patient.name,
      description: `DNI: ${patient.dni || 'N/A'} - ${patient.age || 'N/A'} años`
    }));

    // Add option to create new patient
    listItems.push({
      id: 'new_patient',
      title: '➕ Crear nuevo paciente',
      description: 'Si el paciente no está en la lista'
    });

    await WhatsAppService.sendListMessage(
      from,
      '👤 Completar Paciente',
      'Selecciona el paciente para este estudio:',
      listItems
    );
    
  } catch (error) {
    console.error('❌ [WhatsApp Handler] Error sending patient list:', error);
    await WhatsAppService.sendTextMessage(
      from,
      '❌ Error cargando la lista de pacientes. Por favor, intenta nuevamente.'
    );
  }
}

async function sendDoctorSelection(from: string) {
  try {
    const users = await getAllUsers();
    
    const listItems = users.slice(0, 10).map(user => ({
      id: user.id,
      title: user.name,
      description: user.specialty || user.role || 'Médico'
    }));

    await WhatsAppService.sendListMessage(
      from,
      '👨‍⚕️ Completar Médico Requirente',
      'Selecciona el médico solicitante para este estudio:',
      listItems
    );
    
  } catch (error) {
    console.error('❌ [WhatsApp Handler] Error sending doctor list:', error);
    await WhatsAppService.sendTextMessage(
      from,
      '❌ Error cargando la lista de médicos. Por favor, intenta nuevamente.'
    );
  }
}

async function createStudyFromWhatsApp(from: string, session: any, contactName: string) {
  try {
    await WhatsAppService.sendTextMessage(
      from,
      '⏳ Creando estudio en el sistema...'
    );

    // Get patient and doctor names for the AI flow
    const [patients, users] = await Promise.all([
      getAllPatients(),
      getAllUsers()
    ]);
    
    const patient = patients.find(p => p.id === session.patientId);
    const requestingDoctor = users.find(u => u.id === session.requestingDoctorId);
    
    if (!patient || !requestingDoctor) {
      throw new Error('No se pudo encontrar el paciente o médico seleccionado');
    }

    // Prepare input for study upload flow
    const input: StudyUploadFlowInput = {
      videoDataUri: session.videoUrl,
      patientName: patient.name,
      requestingDoctorName: requestingDoctor.name,
      description: `Estudio subido vía WhatsApp por ${contactName}`
    };

    console.log(`📋 [WhatsApp Handler] Creating study with AI flow:`, {
      patient: patient.name,
      doctor: requestingDoctor.name,
      createdBy: contactName,
      createdVia: 'whatsapp'
    });

    // Call the real study creation flow
    const result = await studyUploadFlow(input);
    
    console.log(`✅ [WhatsApp Handler] Study created successfully:`, result);

    await WhatsAppService.sendTextMessage(
      from,
      `✅ *¡Estudio creado exitosamente!*\n\n📋 *ID del estudio:* ${result.studyId}\n👤 *Paciente:* ${patient.name}\n👨‍⚕️ *Médico solicitante:* ${requestingDoctor.name}\n🎥 *Video:* Subido correctamente\n\n🌐 El estudio ya está disponible en la plataforma web: https://heartlink--heartlink-f4ftq.us-central1.hosted.app/dashboard/studies/${result.studyId}\n\n💬 Envía otro video para crear un nuevo estudio.`
    );

    // Clean up session
    studySessions.delete(from);
    
  } catch (error) {
    console.error('❌ [WhatsApp Handler] Study creation error:', error);
    await WhatsAppService.sendTextMessage(
      from,
      `❌ Error creando el estudio: ${error instanceof Error ? error.message : 'Error desconocido'}\n\nPor favor, intenta nuevamente o contacta al administrador.`
    );
  }
}