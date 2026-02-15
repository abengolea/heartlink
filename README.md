# HeartLink - Sistema de Gestión de Estudios Cardíacos

## Configuración de Firebase

### Variables de Entorno Requeridas

Crea un archivo `.env.local` en la raíz del proyecto con:

```bash
# Firebase Service Account Key (JSON completo)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# Configuración del proyecto
NEXT_PUBLIC_FIREBASE_PROJECT_ID=heartlink-f4ftq
FIREBASE_STORAGE_BUCKET=heartlink-f4ftq.firebasestorage.app
```

### Seguridad
- ⚠️ **NUNCA** subas el archivo `.env.local` al repositorio
- ⚠️ **NUNCA** hagas commit de las claves de servicio
- El archivo `.gitignore` ya está configurado para proteger estos archivos

### Configuración de Firebase Storage

1. Ve a Firebase Console → Storage → Rules
2. Configura las reglas de acceso para permitir uploads
3. Asegúrate de que el bucket `heartlink-f4ftq.firebasestorage.app` esté configurado

## Instalación (Local)

### 1. Dependencias

```bash
# Proyecto principal (Next.js)
npm install

# Firebase Functions (opcional, para emuladores)
cd functions && npm install && cd ..
```

### 2. Variables de entorno

```bash
# Copia la plantilla
cp .env.example .env.local

# Edita .env.local y completa los valores de Firebase
```

**Mínimo para desarrollo local:** configura las variables de Firebase en `.env.local` (ver sección "Variables de Entorno Requeridas" arriba).

### 3. Ejecutar en local

```bash
npm run dev
```

La app estará en **http://localhost:4000**

## Cron de Suscripciones

El proyecto incluye una Cloud Function programada que procesa suscripciones vencidas diariamente (03:00 UTC).

### Desplegar el cron

```bash
cd functions
npm install
firebase deploy --only functions
```

### Variables para la Cloud Function

Configura en Firebase Console → Functions → Variables de entorno (o en `.env` al desplegar):

- `APP_URL`: URL de la app (ej: `https://heartlink--heartlink-f4ftq.us-central1.hosted.app`)
- `CRON_SECRET_TOKEN`: Token para autorizar la llamada (debe coincidir con `CRON_SECRET_TOKEN` en la app)

La función llama a `GET /api/cron/process-subscriptions` con `Authorization: Bearer <CRON_SECRET_TOKEN>`.

## Eliminación de Datos (GDPR / Meta)

Los endpoints `/api/data-deletion` y `/api/data-deletion/status` cumplen con los requisitos de Meta para WhatsApp:

- **POST /api/data-deletion**: Recibe solicitudes de Meta, almacena la petición en Firestore y ejecuta la eliminación/anonymización de datos.
- **GET /api/data-deletion/status?code=XXX**: Muestra el estado real de la solicitud verificando el código en Firestore.
