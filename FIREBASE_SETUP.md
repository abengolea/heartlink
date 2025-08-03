# 🔐 Solución: Error de Credenciales Firebase en HeartLink

## 🔴 **PROBLEMA:**
Al intentar subir videos, aparece el error: **"Error de credenciales Firebase"**

## ✅ **CAUSA:**
Faltan las credenciales de Firebase en el archivo `.env.local`

## 🚀 **SOLUCIÓN PASO A PASO:**

### **1. Obtener las Credenciales de Firebase**

#### 📋 **Opción A: Desde Firebase Console (Recomendado)**

1. **Ve a Firebase Console:**
   ```
   https://console.firebase.google.com/project/heartlink-f4ftq/settings/serviceaccounts/adminsdk
   ```

2. **Generar nueva clave:**
   - Haz clic en **"Generar nueva clave privada"**
   - Se descargará un archivo JSON

3. **Copiar el contenido:**
   - Abre el archivo JSON descargado
   - Copia **TODO** el contenido (sin saltos de línea)

#### 📋 **Opción B: Usando Firebase CLI**

```bash
firebase login
firebase projects:list
firebase service-accounts:keys:create service-account.json --project heartlink-f4ftq
```

### **2. Configurar el Archivo .env.local**

#### **Editar .env.local:**

```bash
# Firebase Configuration for HeartLink
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"heartlink-f4ftq","private_key_id":"tu_private_key_id","private_key":"-----BEGIN PRIVATE KEY-----\ntu_private_key\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxxxx@heartlink-f4ftq.iam.gserviceaccount.com","client_id":"tu_client_id","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40heartlink-f4ftq.iam.gserviceaccount.com"}

FIREBASE_STORAGE_BUCKET=heartlink-f4ftq.firebasestorage.app
NEXT_PUBLIC_FIREBASE_PROJECT_ID=heartlink-f4ftq
```

#### **⚠️ IMPORTANTE:**
- Reemplaza **TODO** el JSON después de `FIREBASE_SERVICE_ACCOUNT_KEY=`
- El JSON debe estar en **UNA SOLA LÍNEA**
- No agregues espacios extra

### **3. Verificar la Configuración**

#### **Ejecutar el script de verificación:**
```bash
./setup-firebase-credentials.sh
```

#### **O verificar manualmente:**
```bash
# Verificar que el archivo existe
ls -la .env.local

# Verificar que las variables están configuradas
grep "FIREBASE_SERVICE_ACCOUNT_KEY" .env.local

# Iniciar el servidor
npm run dev
```

### **4. Probar la Subida de Videos**

1. **Iniciar el servidor:**
   ```bash
   npm run dev
   ```

2. **Ir a la aplicación:**
   ```
   http://localhost:9002
   ```

3. **Navegar a:**
   - Dashboard → Studies → Upload
   - O Dashboard → WhatsApp Upload

4. **Subir un video de prueba**

## 🔧 **Troubleshooting**

### **Error: "Invalid JSON format"**
- Verifica que el JSON esté en una sola línea
- No debe tener saltos de línea dentro del valor
- Las comillas dobles deben estar escapadas correctamente

### **Error: "Permission denied"**
- Verifica que la Service Account tenga rol de "Storage Admin"
- Ve a IAM en Google Cloud Console
- Asigna los permisos necesarios

### **Error: "Bucket not found"**
- Verifica que `FIREBASE_STORAGE_BUCKET` sea correcto
- Debe ser: `heartlink-f4ftq.firebasestorage.app`

### **El archivo .env.local no se carga**
- Reinicia el servidor de desarrollo
- Verifica que el archivo esté en la raíz del proyecto
- No debe estar en .gitignore (pero sí debe estar listado)

## 📋 **Checklist Final**

- [ ] ✅ Archivo `.env.local` creado
- [ ] ✅ `FIREBASE_SERVICE_ACCOUNT_KEY` configurado
- [ ] ✅ `FIREBASE_STORAGE_BUCKET` configurado  
- [ ] ✅ `.env.local` en `.gitignore`
- [ ] ✅ Servidor reiniciado
- [ ] ✅ Upload de video funciona

## 🎯 **Script de Configuración Automática**

Hemos creado un script que te ayuda con todo:

```bash
./setup-firebase-credentials.sh
```

Este script:
- ✅ Crea el archivo `.env.local` si no existe
- ✅ Te guía paso a paso
- ✅ Protege el archivo en `.gitignore`
- ✅ Verifica la configuración

## 🔐 **Seguridad**

### **⚠️ NUNCA HAGAS:**
- Subir `.env.local` al repositorio
- Compartir las credenciales en chats/emails
- Hardcodear las credenciales en el código

### **✅ SIEMPRE HAZLO:**
- Mantén `.env.local` en `.gitignore`
- Usa variables de entorno en producción
- Rota las credenciales periódicamente

---

**Una vez completados estos pasos, el upload de videos funcionará perfectamente en HeartLink.** 🚀