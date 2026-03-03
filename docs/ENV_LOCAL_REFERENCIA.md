# Variables de entorno para .env.local – HeartLink

Copia este contenido a `.env.local` y reemplaza los valores entre `<>` con tus datos reales.

---

## OBLIGATORIAS – Firebase (sin esto la app no funciona)

```env
# Firebase Cliente (Frontend)
# Obtener en: Firebase Console → Configuración del proyecto → General → Tus apps
NEXT_PUBLIC_FIREBASE_API_KEY=<tu_api_key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=heartlink-f4ftq.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=heartlink-f4ftq
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=heartlink-f4ftq.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<tu_sender_id>
NEXT_PUBLIC_FIREBASE_APP_ID=<tu_app_id>

# Firebase Admin (Backend) – Service Account
# Obtener en: Firebase Console → Configuración → Cuentas de servicio → Generar nueva clave
# Pegar el JSON completo como string (una sola línea)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"heartlink-f4ftq",...}
FIREBASE_STORAGE_BUCKET=heartlink-f4ftq.firebasestorage.app

# Requerido por firebase-admin v12 para Auth
GOOGLE_CLOUD_QUOTA_PROJECT=heartlink-f4ftq
```

---

## OBLIGATORIAS – App

```env
# URL base de la app
# Local: http://localhost:3000
# Producción: https://heartlink--heartlink-f4ftq.us-central1.hosted.app
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email que se promueve a admin cuando no hay administradores (bootstrap)
ADMIN_BOOTSTRAP_EMAIL=abengolea1@gmail.com
```

---

## OPCIONALES – Según funcionalidades

### MercadoPago (suscripciones)

```env
# Access Token de producción: developers.mercadopago.com → Tu app → Credenciales
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxxxxxxxxxxxxxx

# Simular pagos sin MercadoPago (desarrollo / cuando PolicyAgent bloquea)
# MERCADOPAGO_SIMULATE=true
```

### DLocal (pagos – alternativa a MercadoPago)

```env
# Credenciales: dashboard.dlocal.com → Integration → API Credentials
# Crear credenciales separadas para Sandbox y Live
DLOCAL_X_LOGIN=<tu_x_login>
DLOCAL_X_TRANS_KEY=<tu_x_trans_key>
DLOCAL_SECRET_KEY=<tu_secret_key>

# true = Sandbox (https://marketplace-api.dlocal-sbox.com)
# false o vacío = Producción (https://marketplace-api.dlocal.com)
DLOCAL_SANDBOX=true
```

### WhatsApp (envío de mensajes)

```env
# ID del número de teléfono en Meta Business Manager
PHONE_NUMBER_ID=693302653873170

# Token permanente del System User (Meta Business Manager → WhatsApp → API Setup)
WHATSAPP_TOKEN=xxxxxxxxxxxxxxxxxxxx

# Idioma de plantillas (opcional, default: es_AR)
WHATSAPP_TEMPLATE_LANGUAGE=es_AR
```

### NotificasHub (recepción de videos por WhatsApp)

```env
# Credenciales del proyecto Firebase de NotificasHub (hub de notificaciones)
NOTIFICASHUB_PROJECT_ID=studio-3864746689-59018
NOTIFICASHUB_CLIENT_EMAIL=firebase-adminsdk-xxxxx@studio-3864746689-59018.iam.gserviceaccount.com
NOTIFICASHUB_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Secreto compartido para validar webhooks que NotificasHub envía a HeartLink
INTERNAL_SECRET=<secreto_compartido_con_notificashub>
```

### Genkit / IA (transcripción, etc.)

```env
GEMINI_API_KEY=<tu_api_key_gemini>
# o
GOOGLE_API_KEY=<tu_google_api_key>
```

### URLs públicas (enlaces compartidos de estudios)

```env
# Si usas dominio personalizado
NEXT_PUBLIC_PUBLIC_SHARE_BASE_URL=https://tu-dominio.com
```

### Cron / tareas programadas

```env
CRON_SECRET_TOKEN=heartlink-cron-2025
```

### Modo desarrollo WhatsApp

```env
WHATSAPP_DEV_MODE=true
```

---

## Referencia rápida – Dónde obtener cada dato

| Variable | Dónde obtenerla |
|----------|-----------------|
| **Firebase (cliente)** | Firebase Console → Configuración → General → Tus apps → SDK |
| **FIREBASE_SERVICE_ACCOUNT_KEY** | Firebase Console → Configuración → Cuentas de servicio → Generar nueva clave → Descargar JSON |
| **MERCADOPAGO_ACCESS_TOKEN** | developers.mercadopago.com → Tu aplicación → Credenciales → Production |
| **DLOCAL_X_LOGIN** | dashboard.dlocal.com → Integration → API Credentials |
| **DLOCAL_X_TRANS_KEY** | dashboard.dlocal.com → Integration → API Credentials |
| **DLOCAL_SECRET_KEY** | dashboard.dlocal.com → Integration → API Credentials (solo se muestra una vez) |
| **PHONE_NUMBER_ID** | Meta Business Manager → WhatsApp → API Setup |
| **WHATSAPP_TOKEN** | Meta Business Manager → System Users → Permisos → Token permanente |
| **NOTIFICASHUB_*** | Proyecto Firebase de NotificasHub + Service Account |
| **GEMINI_API_KEY** | Google AI Studio / Google Cloud Console |

---

## Mínimo para desarrollo local (sin WhatsApp ni pagos)

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=heartlink-f4ftq.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=heartlink-f4ftq
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=heartlink-f4ftq.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
FIREBASE_STORAGE_BUCKET=heartlink-f4ftq.firebasestorage.app
GOOGLE_CLOUD_QUOTA_PROJECT=heartlink-f4ftq

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_BOOTSTRAP_EMAIL=tu@email.com
```
