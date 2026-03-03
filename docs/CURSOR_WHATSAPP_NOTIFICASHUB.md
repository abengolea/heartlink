# 📱 GUÍA CURSOR: WhatsApp, Médico Operador y NotificasHub

Este documento explica en detalle qué queremos lograr desde el **médico operador**, qué está implementado en HeartLink, y cómo configurar NotificasHub.

---

## 🎯 OBJETIVO: Flujo del Médico Operador

**Meta:** Que un médico operador (o administrador) con cuenta en HeartLink pueda:

1. **Cargar un estudio (video)** desde WhatsApp → sin abrir la app web
2. **Todo el proceso automático:**
   - Video recibido → subido a Firebase Storage
   - Estudio creado en Firestore
   - Paciente y médico solicitante asignados (vía listas interactivas en WhatsApp)
   - El médico solicitante recibe **al instante** por WhatsApp el link del estudio

2. **Alternativa desde la app:** El operador también puede subir desde el dashboard web (`/dashboard/studies/upload`) o enviar estudios ya creados por WhatsApp usando el botón "Enviar por WhatsApp" / "Compartir".

---

## 🏗️ ARQUITECTURA: HeartLink vs NotificasHub

| Componente | Responsabilidad | ¿Recibe? | ¿Envía? |
|------------|-----------------|----------|---------|
| **HeartLink** | App de estudios cardiológicos | ❌ No (en la arquitectura actual) | ✅ Sí (notificaciones al médico) |
| **NotificasHub** | Hub central de notificaciones | ✅ Sí (webhook de Meta: estados "entregado", "leído") | — |

**Regla clave:**
- **`WHATSAPP_VERIFY_TOKEN` / `MESSENGER_VERIFY_TOKEN`** → **solo NotificasHub** (para el webhook que recibe estados de entrega de Meta)
- **HeartLink** solo envía mensajes. Variables requeridas en `.env.local`:
  - `PHONE_NUMBER_ID`
  - `WHATSAPP_TOKEN`
  - `NOTIFICASHUB_PROJECT_ID`
  - `NOTIFICASHUB_CLIENT_EMAIL`
  - `NOTIFICASHUB_PRIVATE_KEY`

---

## 📂 LO QUE ESTÁ IMPLEMENTADO EN HEARTLINK

### 1. Flujo de recepción (webhook) — *código presente pero arquitectura indica que la recepción va en NotificasHub*

**Archivos:**
- `src/app/api/whatsapp/webhook/route.ts` — Webhook GET/POST para Meta
- `src/services/whatsapp-handler.ts` — Handler del flujo completo
- `src/lib/whatsapp/parseWebhook.ts` — Parseo del payload de Meta

**Flujo implementado en el handler:**

1. **Video recibido** (`handleVideoMessage`):
   - Valida operador: `getOperatorByWhatsAppPhone(from)` — busca en Firestore `users` con `role` in `['operator','admin']` donde `phone` coincide con el número de WhatsApp
   - Valida licencia: `checkUserAccess(operator.id)`
   - Descarga video: `WhatsAppService.downloadMedia(message.video.id)` → usa `WHATSAPP_TOKEN` o `WHATSAPP_ACCESS_TOKEN`
   - Sube a Storage: `uploadVideoFromBuffer(videoBuffer, ...)` → Firebase Storage
   - Crea sesión en memoria: `studySessions.set(from, { videoUrl, operatorId, step: 'waiting_patient', ... })`
   - Envía lista de pacientes: `sendPatientSelection(from, operatorId)` — usa `WhatsAppService.sendListMessage`

2. **Selección paciente** (`handleInteractiveMessage`, step `waiting_patient`):
   - Si `new_patient` → pide nombre por texto (`waiting_patient_name`)
   - Si paciente existente → `sendDoctorSelection(from, operatorId)` — médicos de `getDoctorsByOperator(operatorId)` (colección `operator_doctors`)

3. **Selección médico** (`handleInteractiveMessage`, step `waiting_doctor`):
   - Si selecciona "Agregar médico por teléfono" → step `waiting_doctor_phone`
   - Puede compartir un **contacto (vCard)** o escribir el número. Tipo `contacts` → `handleContactsMessage`
   - Crea estudio: `studyUploadFlow(input)` → `createStudy`, `findOrCreatePatient`
   - Genera link público: `generateOrGetShareTokenAndUrl(studyId)`
   - Confirma al operador por WhatsApp
   - **Notifica al médico solicitante** si tiene `phone`: `WhatsAppService.sendTextMessage(requestingDoctor.phone, ...)`

**Comandos de texto:** `hola`, `ayuda`, `cancelar` — en `handleTextMessage`.
**Mensaje contacts:** cuando el operador comparte un contacto en `waiting_doctor_phone` → `handleContactsMessage`.

---

### 2. Envío de mensajes (HeartLink sí usa esto)

**Servicio:** `src/services/whatsapp.ts` — `WhatsAppService`
- Usa `PHONE_NUMBER_ID` o `WHATSAPP_PHONE_NUMBER_ID`
- Usa `WHATSAPP_TOKEN` o `WHATSAPP_ACCESS_TOKEN`
- Métodos: `sendTextMessage`, `sendListMessage`, `downloadMedia`

**Endpoints de envío:**
- `POST /api/whatsapp/test` — envía mensaje de prueba (body: `{ to, message? }`)
- `POST /api/studies/[id]/send-whatsapp` — envía link del estudio a un número (requiere auth)
- `POST /api/whatsapp/send` — envía usando **template** `notificas_estudio_medico` (variables: HeartLink, medicoNombre, paciente, link) y **guarda en NotificasHub** (`hubDb.collection("sends").add(...)`)

**NotificasHub en HeartLink:**
- `src/lib/notificashub.ts` — `getNotificasHubDb()` conecta a Firebase del proyecto `NOTIFICASHUB_PROJECT_ID` con `NOTIFICASHUB_CLIENT_EMAIL` y `NOTIFICASHUB_PRIVATE_KEY`
- Se usa en `/api/whatsapp/send` para registrar envíos en la colección `sends`:
  - `appId: "heartlink"`
  - `to`, `medicoNombre`, `estudio`, `link`, `messageId`, `sentAt`, `status: "sent"`

---

### 3. Datos en Firestore (HeartLink)

- **users**: `role` (`operator`, `admin`, `solicitante`, `medico_solicitante`), `phone` (para vincular WhatsApp)
- **operator_doctors**: `operatorId`, `requesterId` — vínculos operador ↔ médico solicitante
- **patients**: `requesterId` (médico solicitante dueño del paciente)
- **studies**: `patientId`, `requestingDoctorId`, `videoUrl`, `shareToken`, etc.

---

## ⚙️ CONFIGURACIÓN DE NOTIFICASHUB (para Cursor / desarrolladores)

Para que NotificasHub funcione con HeartLink:

### 1. Webhook de Meta
- **URL**: la de NotificasHub (no la de HeartLink)
- **Verify Token**: `MESSENGER_VERIFY_TOKEN` / `WHATSAPP_VERIFY_TOKEN` — **solo en env de NotificasHub**
- **Eventos**: `messages` si se reciben mensajes; para solo estados de entrega, los que correspondan

### 2. Colección `sends` en Firestore de NotificasHub
- HeartLink escribe aquí al enviar por `/api/whatsapp/send`:
  ```json
  {
    "appId": "heartlink",
    "to": "5493364513355",
    "medicoNombre": "Dr. García",
    "estudio": "Ecocardiograma 2025-01",
    "link": "https://...",
    "messageId": "wamid.xxx",
    "sentAt": "2025-03-01T...",
    "status": "sent"
  }
  ```
- NotificasHub puede usar `messageId` para correlacionar con webhooks de estado (delivered, read, etc.)

### 3. Variables en HeartLink
```env
PHONE_NUMBER_ID=693302653873170
# WHATSAPP_TOKEN — el token permanente del System User HeartLink_WhatsApp
WHATSAPP_TOKEN=<token permanente de Meta>
NOTIFICASHUB_PROJECT_ID=studio-3864746689-59018
NOTIFICASHUB_CLIENT_EMAIL=firebase-adminsdk-fbsvc@studio-3864746689-59018.iam.gserviceaccount.com
NOTIFICASHUB_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
# Mismo secreto que en NotificasHub (para /api/whatsapp/incoming)
INTERNAL_SECRET=un_secreto_largo_cualquiera
```

### 4. Variables en NotificasHub
```env
HEARTLINK_URL=https://tu-heartlink.vercel.app
INTERNAL_SECRET=el_mismo_secreto_que_en_HeartLink
```
NotificasHub reenvía mensajes de WhatsApp a `POST {HEARTLINK_URL}/api/whatsapp/incoming` con header `x-internal-token: {INTERNAL_SECRET}`.

### 5. Operador en Firestore (HeartLink)

En Firestore de HeartLink, colección `users`, el documento del operador debe tener:
```
phone: "543364645357"    // sin + ni espacios; debe coincidir con número de WhatsApp
role: "operator"  // o "admin"
```

### 6. Template en Meta
- Nombre: `notificas_estudio_medico`
- Variables: `{{1}}` HeartLink, `{{2}}` medicoNombre, `{{3}}` paciente, `{{4}}` link
- Idioma: `WHATSAPP_TEMPLATE_LANGUAGE` (ej: `es_AR`)

---

## 🧪 CÓMO PROBAR

1. **GET** `http://localhost:4000/api/whatsapp/test` — estado
2. **POST** `http://localhost:4000/api/whatsapp/test` — body: `{ "to": "+5493364513355" }`
3. Desde dashboard: estudio → botón "Enviar por WhatsApp" / "Compartir por WhatsApp"
4. En Meta modo desarrollo: agregar números en "Para" para poder enviarles

---

## 📍 UBICACIÓN DE CÓDIGO CLAVE

| Funcionalidad | Archivo |
|---------------|---------|
| Webhook Meta | `src/app/api/whatsapp/webhook/route.ts` |
| Handler video/listas | `src/services/whatsapp-handler.ts` |
| Envío texto/listas | `src/services/whatsapp.ts` |
| Envío con template + NotificasHub | `src/app/api/whatsapp/send/route.ts` |
| Envío link estudio (auth) | `src/app/api/studies/[id]/send-whatsapp/route.ts` |
| Recepción desde NotificasHub | `src/app/api/whatsapp/incoming/route.ts` |
| Conexión NotificasHub | `src/lib/notificashub.ts` |
| Operador por teléfono | `src/lib/firestore.ts` → `getOperatorByWhatsAppPhone` |
| Médicos del operador | `src/lib/firestore.ts` → `getDoctorsByOperator` |
| Creación estudio | `src/ai/flows/study-upload-flow.ts` |

---

*Documento para contexto de Cursor al trabajar en WhatsApp y NotificasHub.*
