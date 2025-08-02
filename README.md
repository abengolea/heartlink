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

## Instalación

```bash
npm install
npm run dev
```
