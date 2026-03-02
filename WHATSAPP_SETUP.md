# 📱 WHATSAPP BUSINESS INTEGRATION - SETUP GUIDE

> **📖 Para Cursor / desarrollo:** Ver `docs/CURSOR_WHATSAPP_NOTIFICASHUB.md` con detalle del flujo operador, código implementado y configuración de NotificasHub.

> **📌 Regla para HeartLink:** HeartLink **solo envía** mensajes (notificaciones al médico cuando el estudio está listo).
> No recibe mensajes ni tiene webhook propio. Las únicas variables que necesita en `.env.local` son:
> `PHONE_NUMBER_ID`, `WHATSAPP_TOKEN`, `NOTIFICASHUB_PROJECT_ID`, `NOTIFICASHUB_CLIENT_EMAIL`, `NOTIFICASHUB_PRIVATE_KEY`.
> El `WHATSAPP_VERIFY_TOKEN` / `MESSENGER_VERIFY_TOKEN` es **solo para NotificasHub** (el hub que recibe estados de entrega de Meta).

---

## 🎯 FLUJO RECEPCIÓN (en NotificasHub): Video WhatsApp → Estudio en Sistema

### **📱 PROCESO PASO A PASO:**

1. **🔐 Validación:** Solo médicos operadores con licencia mensual activa pueden subir (número vinculado en perfil)
2. **🎥 Operador envía video** → WhatsApp Business
3. **🤖 Sistema recibe video** → Webhook valida licencia y procesa
4. **💾 Video se sube** → Firebase Storage
5. **📝 Sistema responde:** "👤 Completar Paciente:" + lista (solo pacientes de sus médicos vinculados)
6. **👤 Operador selecciona paciente** → Respuesta WhatsApp
7. **📝 Sistema responde:** "👨‍⚕️ Completar Médico Requirente:" + lista (solo médicos vinculados)
8. **👨‍⚕️ Operador selecciona médico** → Respuesta WhatsApp
9. **✅ Estudio creado** → Aparece en la plataforma
10. **📱 Notificación automática** → El médico solicitante recibe por WhatsApp el link público (si tiene teléfono configurado)

---

## 🔧 CONFIGURACIÓN NECESARIA

### **1. Meta Developer Console (Facebook)**

1. **Crear App en Meta Developer Console:**
   - Ve a: https://developers.facebook.com/
   - Crear nueva app → Tipo: Business
   - Agregar producto: WhatsApp Business API

2. **Configurar WhatsApp Business API:**
   - Obtener **Access Token** (temporal para testing)
   - Obtener **Phone Number ID** del número de prueba
   - Generar **Access Token permanente** para producción

3. **Configurar Webhook:**
   - **Webhook URL:** `{NEXT_PUBLIC_APP_URL}/api/whatsapp/webhook`
   - La URL base viene de `.env` / `.env.local` → `NEXT_PUBLIC_APP_URL`
   - Meta **no puede acceder a localhost**: para desarrollo local usar ngrok u otro túnel (ej: `https://xxx.ngrok.io`)
   - En producción: usar tu URL pública real (HTTPS)
   - **Verify Token:** valor de `WHATSAPP_VERIFY_TOKEN` en tu `.env` (ej: `notificas_webhook_2026`)
   - **Suscribir a eventos:** `messages` ← **IMPORTANTE: debe estar marcado**
   - En "Configurar webhooks" → "Editar" → Suscripciones: marcar **messages**

### **2. Firebase Secrets (Ya configurado)**

```bash
# Agregar secrets en Firebase Console:
firebase apphosting:secrets:set WHATSAPP_ACCESS_TOKEN --project heartlink-f4ftq
firebase apphosting:secrets:set WHATSAPP_PHONE_NUMBER_ID --project heartlink-f4ftq

# Dar acceso al backend:
firebase apphosting:secrets:grantaccess WHATSAPP_ACCESS_TOKEN --backend heartlink --project heartlink-f4ftq
firebase apphosting:secrets:grantaccess WHATSAPP_PHONE_NUMBER_ID --backend heartlink --project heartlink-f4ftq
```

---

## ⚠️ NO RECIBO MENSAJES - CHECKLIST

Si envías un mensaje y no hay respuesta:

1. **Webhook suscrito a "messages"**
   - Meta Developer Console → WhatsApp → Configuración → Webhooks
   - Clic en el webhook configurado → Suscripciones
   - Debe estar marcado **messages**

2. **Número "Para" en modo prueba**
   - En Configuración de la API, Paso 1 "Seleccionar números de teléfono"
   - En "Para" agrega tu número (el que envía el mensaje)
   - En modo desarrollo solo recibes de números que hayas agregado

3. **Logs en Google Cloud**
   - Si ves `[WhatsApp Webhook] POST RECIBIDO` → Meta está enviando, revisa el handler
   - Si NO ves POST → Meta no envía; verifica suscripción y número "Para"

---

## 🧪 TESTING

### **1. Verificar Webhook:**
```bash
# Reemplaza $APP_URL por tu NEXT_PUBLIC_APP_URL (ej: http://localhost:4000)
curl "$APP_URL/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=$WHATSAPP_VERIFY_TOKEN&hub.challenge=test123"
# Debería devolver: test123
```

### **2. Test de Mensaje:**
```bash
curl -X POST $APP_URL/api/whatsapp/test \
  -H "Content-Type: application/json" \
  -d '{"to": "+5491234567890"}'
```

### **3. Estados del Sistema:**
```bash
curl $APP_URL/api/whatsapp/test
```

---

## 📱 USO DEL SISTEMA

### **Comandos de WhatsApp:**

- **"hola"** → Saludo y instrucciones
- **"ayuda"** → Manual de uso completo
- **"cancelar"** → Cancelar proceso actual
- **🎥 Video** → Iniciar creación de estudio

### **Flujo de Usuario:**

```
Doctor: [Envía video] 🎥

Sistema: 🎥 ¡Video recibido!
         ⏳ Procesando y subiendo...
         
         👤 Completar Paciente:
         [Lista interactiva con pacientes]

Doctor: [Selecciona: "Ana María López"]

Sistema: 👨‍⚕️ Completar Médico Requirente:
         [Lista interactiva con médicos]

Doctor: [Selecciona: "Dr. Carlos González"]

Sistema: ✅ ¡Estudio creado exitosamente!
         
         📋 ID del estudio: ABC123
         👤 Paciente: Ana María López  
         👨‍⚕️ Médico solicitante: Dr. Carlos González
         🎥 Video: Subido correctamente
         
         🌐 {NEXT_PUBLIC_APP_URL}/dashboard/studies/ABC123
         
         💬 Envía otro video para crear un nuevo estudio.
```

---

## 🔧 ENDPOINTS DISPONIBLES

| Endpoint | Método | Propósito |
|----------|--------|-----------|
| `/api/whatsapp/webhook` | GET | Verificación de webhook |
| `/api/whatsapp/webhook` | POST | Recibir mensajes de WhatsApp |
| `/api/whatsapp/test` | GET | Estado del sistema |
| `/api/whatsapp/test` | POST | Enviar mensaje de prueba |

---

## 🚀 CARACTERÍSTICAS

### **✅ Funcionalidades Implementadas:**

- **🔐 Validación de licencia:** Solo operadores con suscripción activa pueden subir por WhatsApp
- **📱 Vinculación por teléfono:** El número de WhatsApp del operador debe coincidir con `phone` en su perfil
- **🎥 Recepción de videos** desde WhatsApp
- **📤 Subida automática** a Firebase Storage
- **📋 Listas filtradas:** Pacientes y médicos según vínculos del operador
- **🤖 Integración con AI flow** para creación de estudios
- **🔗 Link público** generado automáticamente
- **📲 Notificación al médico solicitante:** Recibe por WhatsApp el link del estudio cuando está listo (requiere `phone` en perfil)
- **💬 Sistema de comandos** (hola, ayuda, cancelar)
- **🔄 Gestión de sesiones** por usuario

### **⚡ Beneficios:**

- **⏱️ Proceso ultrarrápido:** Video → Estudio en 2 minutos
- **📱 Sin app necesaria:** Solo WhatsApp
- **🤖 Totalmente automático:** Sin intervención manual
- **📊 Mismos datos** que el sistema web
- **🔗 Integración perfecta** con workflow existente

---

## 🔐 SEGURIDAD

- **🔑 Webhook verification** con token secreto
- **🛡️ Firebase ADC** para autenticación
- **📊 Logging completo** de todas las operaciones
- **⚠️ Manejo de errores** robusto
- **🧹 Limpieza automática** de sesiones temporales

---

## 📝 CONFIGURACIÓN DE OPERADORES

Para que un médico operador pueda subir estudios por WhatsApp:

1. **Perfil del operador en Firestore:** Colección `users`, documento del operador:
   - `phone`: `"543364645357"` (sin + ni espacios; debe coincidir con número de WhatsApp)
   - `role`: `"medico_operador"` (o `"operator"` o `"admin"`)
2. **Licencia activa:** Debe tener suscripción mensual activa en la plataforma
3. **Médicos solicitantes:** Vincular médicos en "Médicos Solicitantes" para que aparezcan en la lista

Para que el médico solicitante reciba la notificación cuando el estudio está listo:

1. **Perfil del médico solicitante:** Debe tener `phone` configurado con su número de WhatsApp

---

## 📝 NEXT STEPS

1. **🔑 Configurar Access Token** permanente en Meta Console
2. **📱 Probar con número real** de WhatsApp Business
3. **🔄 Testing completo** del flujo end-to-end
4. **📊 Monitoreo** de logs en producción

¡El sistema está listo para procesar estudios médicos vía WhatsApp! 🚀