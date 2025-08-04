# 🔐 Configuración de Secrets en Firebase App Hosting

## PASO 1: Crear los Secrets necesarios

### 1. Firebase Service Account Key

```bash
# Crear el secret para las credenciales de Firebase
firebase apphosting:secrets:set firebase-service-account-key --project heartlink-f4ftq
```

**Valor a pegar:** Usa el JSON completo de las credenciales de Firebase que descargaste de la consola.

### 2. WhatsApp Access Token

```bash
# Crear el secret para WhatsApp
firebase apphosting:secrets:set whatsapp-access-token --project heartlink-f4ftq
```

**Valor a pegar:** Usa el token de acceso de WhatsApp Business API.

## PASO 2: Verificar que funciona

Después de configurar los secrets, hacer push del apphosting.yaml:

```bash
git add apphosting.yaml
git commit -m "Add production environment configuration"
git push
```

Firebase automáticamente detectará el archivo y aplicará la configuración.

## ALTERNATIVA: Usar Firebase Console

Si prefieres usar la interfaz web:

1. Ve a: https://console.firebase.google.com/project/heartlink-f4ftq/apphosting
2. Selecciona tu aplicación
3. Ve a "Settings" > "Environment Variables"
4. Agrega los secrets manualmente