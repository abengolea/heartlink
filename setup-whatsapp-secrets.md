# 🔑 CONFIGURACIÓN WHATSAPP SECRETS - FIREBASE

## 📱 **DATOS REALES PROPORCIONADOS:**

- **🔑 Access Token:** `EAAOiBWMCMhgBPKrH6YZBMrpD7qMy2dqWocJQbck1htmgZBC9GZC9ZBGZAbovN7u5FZB0jcHdZCQB12tq8ZBhhnqZAGnnJg3RzQX4JzTUEfhHo5TLW1ZCXgZCxLgNJibxLGnKhwZCIuMAFODGf9LHDM1iX6looN5DQSvtiDGZApN3rRmaDrql6ekrpsyeGUSZCKaYZByIQ0s94NXp1fYpzuikg26iEG2j06GsFJEzh06bQjeUsC1lHeyk5K0ZCWHsZC2pv`
- **📱 Phone Number ID:** `693302653873170`
- **🆔 WhatsApp Account ID:** `2169826596871026`

## 🚀 **COMANDOS PARA EJECUTAR:**

### **1. Configurar Access Token:**
```bash
firebase apphosting:secrets:set WHATSAPP_ACCESS_TOKEN --project heartlink-f4ftq
# Cuando te pida el valor, pega: EAAOiBWMCMhgBPKrH6YZBMrpD7qMy2dqWocJQbck1htmgZBC9GZC9ZBGZAbovN7u5FZB0jcHdZCQB12tq8ZBhhnqZAGnnJg3RzQX4JzTUEfhHo5TLW1ZCXgZCxLgNJibxLGnKhwZCIuMAFODGf9LHDM1iX6looN5DQSvtiDGZApN3rRmaDrql6ekrpsyeGUSZCKaYZByIQ0s94NXp1fYpzuikg26iEG2j06GsFJEzh06bQjeUsC1lHeyk5K0ZCWHsZC2pv
```

### **2. Configurar Phone Number ID:**
```bash
firebase apphosting:secrets:set WHATSAPP_PHONE_NUMBER_ID --project heartlink-f4ftq
# Cuando te pida el valor, pega: 693302653873170
```

### **3. Dar acceso al backend:**
```bash
firebase apphosting:secrets:grantaccess WHATSAPP_ACCESS_TOKEN --backend heartlink --project heartlink-f4ftq
firebase apphosting:secrets:grantaccess WHATSAPP_PHONE_NUMBER_ID --backend heartlink --project heartlink-f4ftq
```

## 🔗 **CONFIGURACIÓN DEL WEBHOOK EN META:**

### **En Meta Developer Console:**

1. **Ve a tu app de WhatsApp Business API**
2. **Sección "Configuration" → "Webhooks":**
   - **Callback URL:** `https://heartlink--heartlink-f4ftq.us-central1.hosted.app/api/whatsapp/webhook`
   - **Verify Token:** `heartlink_webhook_2025`
   - **Webhook fields:** Marcar `messages`

3. **Click "Verify and Save"**

## 🧪 **TESTING:**

### **1. Verificar Webhook:**
```bash
curl "https://heartlink--heartlink-f4ftq.us-central1.hosted.app/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=heartlink_webhook_2025&hub.challenge=test123"
```
**Debería devolver:** `test123`

### **2. Test de Mensaje:**
```bash
curl -X POST https://heartlink--heartlink-f4ftq.us-central1.hosted.app/api/whatsapp/test \
  -H "Content-Type: application/json" \
  -d '{"to": "+5493364645357"}'
```

## 📱 **CÓMO USAR:**

1. **Configura secrets** con los comandos de arriba
2. **Configura webhook** en Meta Console
3. **Envía video por WhatsApp** al número configurado
4. **Sistema responde automáticamente** con listas de pacientes/médicos
5. **¡Estudio creado!** Aparece en la web

## ⚠️ **IMPORTANTE:**

- **El Access Token** es temporal, necesitarás uno permanente para producción
- **El webhook** debe estar configurado para recibir mensajes
- **Los secrets** deben tener acceso al backend de Firebase

¡Ya tienes todo lo necesario para que funcione! 🚀