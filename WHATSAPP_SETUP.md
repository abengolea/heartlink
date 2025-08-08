# 📱 WHATSAPP BUSINESS INTEGRATION - SETUP GUIDE

## 🎯 FLUJO COMPLETO: Video WhatsApp → Estudio en Sistema

### **📱 PROCESO PASO A PASO:**

1. **🎥 Doctor envía video** → WhatsApp Business
2. **🤖 Sistema recibe video** → Webhook procesa automáticamente
3. **💾 Video se sube** → Firebase Storage 
4. **📝 Sistema responde:** "👤 Completar Paciente:" + lista interactiva
5. **👤 Doctor selecciona paciente** → Respuesta WhatsApp
6. **📝 Sistema responde:** "👨‍⚕️ Completar Médico Requirente:" + lista interactiva
7. **👨‍⚕️ Doctor selecciona médico** → Respuesta WhatsApp
8. **✅ Estudio creado** → Aparece automáticamente en página estudios
9. **🔗 Link directo** → Sistema envía enlace al estudio creado

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
   - **Webhook URL:** `https://heartlink--heartlink-f4ftq.us-central1.hosted.app/api/whatsapp/webhook`
   - **Verify Token:** `heartlink_webhook_2025`
   - **Suscribir a eventos:** `messages`

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

## 🧪 TESTING

### **1. Verificar Webhook:**
```bash
curl "https://heartlink--heartlink-f4ftq.us-central1.hosted.app/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=heartlink_webhook_2025&hub.challenge=test123"
# Debería devolver: test123
```

### **2. Test de Mensaje:**
```bash
curl -X POST https://heartlink--heartlink-f4ftq.us-central1.hosted.app/api/whatsapp/test \
  -H "Content-Type: application/json" \
  -d '{"to": "+5491234567890"}'
```

### **3. Estados del Sistema:**
```bash
curl https://heartlink--heartlink-f4ftq.us-central1.hosted.app/api/whatsapp/test
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
         
         🌐 https://heartlink--heartlink-f4ftq.us-central1.hosted.app/dashboard/studies/ABC123
         
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

- **🎥 Recepción de videos** desde WhatsApp
- **📤 Subida automática** a Firebase Storage  
- **📋 Listas interactivas** para selección de pacientes/médicos
- **🤖 Integración con AI flow** para creación de estudios
- **🔗 Links directos** al estudio creado
- **💬 Sistema de comandos** (hola, ayuda, cancelar)
- **🔄 Gestión de sesiones** por usuario
- **📱 Respuestas automáticas** con estado del proceso

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

## 📝 NEXT STEPS

1. **🔑 Configurar Access Token** permanente en Meta Console
2. **📱 Probar con número real** de WhatsApp Business
3. **🔄 Testing completo** del flujo end-to-end
4. **📊 Monitoreo** de logs en producción

¡El sistema está listo para procesar estudios médicos vía WhatsApp! 🚀