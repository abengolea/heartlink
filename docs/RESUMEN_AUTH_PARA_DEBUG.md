# Resumen de autenticación HeartLink — para debugging

## Problema actual del usuario
- Usuario recibió una **nueva contraseña por correo** (flujo "¿Olvidaste tu contraseña?")
- Ingresó esa contraseña en el login
- **Obtiene error** al intentar iniciar sesión

---

## Flujos implementados

### 1. Login con email + contraseña
- **Archivo:** `src/app/page.tsx` → `handleSubmit`
- **Flujo:** Primero intenta `loginWithEmail` (cliente Firebase). Si falla, usa `loginWithEmailViaBackend` (API que llama a REST de Firebase).
- **API backend:** `src/app/api/auth/login-via-backend/route.ts`
  - Llama a `identitytoolkit.googleapis.com/v1/accounts:signInWithPassword`
  - Si las credenciales son válidas, genera un custom token y lo devuelve
  - El cliente hace `signInWithCustomToken` con ese token

### 2. Recuperar contraseña ("¿Olvidaste tu contraseña?")
- **Archivo:** `src/app/page.tsx` → `handleForgotPassword`
- **API:** `src/app/api/auth/reset-password/route.ts`
- **Flujo:**
  1. Usuario ingresa su email
  2. Backend genera contraseña aleatoria (12 caracteres)
  3. Backend actualiza la contraseña en Firebase Auth: `auth.updateUser(uid, { password: newPassword })`
  4. Backend escribe en Firestore colección `mail` con la contraseña en el cuerpo del email
  5. Extensión **Firestore Trigger Email** envía el correo vía Gmail SMTP
  6. Usuario recibe email con la nueva contraseña

### 3. Login con Google
- Botón "Continuar con Google" → `loginWithGoogle()` → `signInWithPopup(auth, googleProvider)`
- Requiere tener "Google" habilitado en Firebase Console → Authentication → Método de acceso

---

## Posibles causas del error al usar la contraseña del email

### A) Typo en el email
- En Firebase Console el usuario aparece como **`abengolea1@gmail.com`** (con O)
- Si el usuario escribe `abengoela1` (con E) → fallará siempre

### B) La contraseña no se actualizó correctamente
- El API `reset-password` hace `auth.updateUser(uid, { password: newPassword })`
- Si hay un error silencioso o la escritura en `mail` falló después de actualizar, el email podría tener una contraseña que ya no es válida
- **Verificar:** En Firebase Console → Authentication → Usuarios, el usuario existe. No hay forma directa de ver si la contraseña se actualizó.

### C) Espacios o caracteres invisibles
- Copiar/pegar la contraseña del email puede incluir espacios al inicio o final
- **Probar:** Escribir la contraseña a mano, sin copiar/pegar

### D) Usuario no existe en Firestore
- Incluso si Firebase Auth acepta el login, la app busca el usuario en Firestore (`users` collection)
- Si no está en Firestore → pantalla "Usuario no registrado"
- **Verificar:** Firestore → colección `users` → documento con `email: "abengolea1@gmail.com"`

### E) Cuenta pendiente de aprobación
- Si el usuario en Firestore tiene `status: "pending_approval"` → pantalla "Cuenta pendiente de aprobación"
- Un admin debe aprobar en el panel

### F) Dominio no autorizado (solo si falla el cliente)
- El backend hace la verificación contra Firebase desde el servidor, sin restricción de dominio
- Si usas el flujo email/contraseña, debería intentar backend tras fallo del cliente

---

## Archivos relevantes

| Archivo | Rol |
|---------|-----|
| `src/app/page.tsx` | Página de login, formularios, handlers |
| `src/lib/firebase-client.ts` | `loginWithEmail`, `loginWithEmailViaBackend`, `loginWithGoogle`, `resetPasswordViaBackend` |
| `src/app/api/auth/login-via-backend/route.ts` | Login vía REST API de Firebase |
| `src/app/api/auth/reset-password/route.ts` | Genera nueva contraseña, actualiza Firebase Auth, envía email vía `mail` collection |
| `src/contexts/auth-context.tsx` | Obtiene usuario de Firestore tras login |
| `src/components/auth-guard.tsx` | Bloquea acceso si no hay firebaseUser o dbUser |
| `extensions/firestore-send-email.env` | Configuración SMTP (Gmail) para enviar emails |

---

## Cómo diagnosticar

1. **Consola del navegador (F12 → Console):** Al intentar login, ver el mensaje exacto (ej. `auth/invalid-credential`, `INVALID_LOGIN_CREDENTIALS`).

2. **Terminal del servidor:** Si corre `npm run dev`, ver logs de la API:
   - `❌ [Login Backend] Auth failed:` → credenciales rechazadas por Firebase
   - `✅ [Reset API] Password updated` y `✅ [Reset API] Email encolado` → el reset debería haber funcionado

3. **Firebase Console:**
   - Authentication → Usuarios: confirmar que `abengolea1@gmail.com` existe
   - Firestore → `users`: confirmar que hay un documento con ese email y `status: "active"`

4. **Probar con Google:** Si "Continuar con Google" funciona con la misma cuenta, el problema está en el flujo email/contraseña específicamente.

---

## Variables de entorno necesarias

- `NEXT_PUBLIC_FIREBASE_API_KEY` — Para el cliente. En build se embebe; en producción debe estar también en runtime.
- `FIREBASE_API_KEY` — (Opcional) Para el backend (login-via-backend). Se lee en runtime. Si falta, usa NEXT_PUBLIC_FIREBASE_API_KEY.
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_APP_URL`
- `FIREBASE_SERVICE_ACCOUNT_KEY` (JSON completo para Firebase Admin)

### Error "API key not valid" en producción

Si el login vía backend devuelve 401 "API key not valid":

1. **Obtener el API key correcto:** Firebase Console → ⚙️ Configuración del proyecto → General → Tus apps → apiKey
2. **Firebase App Hosting:** El secreto `NEXT_PUBLIC_FIREBASE_API_KEY` debe tener ese valor. Se configura en Firebase Console o Google Cloud Secret Manager.
3. **Cloud Run (si aplica):** En Variables & Secrets, agregar `FIREBASE_API_KEY` con el valor del apiKey. El backend usa FIREBASE_API_KEY en runtime (no depende del build).
4. **Redeploy** después de cambiar secretos.

---

## Resumen para otra IA

El usuario usa HeartLink (Next.js + Firebase). Implementamos:
1. Login email/contraseña con fallback a backend
2. Recuperar contraseña: genera nueva contraseña, la envía por Gmail vía Firestore Trigger Email
3. Login con Google

**Problema:** Usuario pidió recuperar contraseña, recibió el email con la nueva contraseña, la ingresó en el login y obtiene error.

**Puntos a revisar:** typo en email (abengolea vs abengoela), espacios al pegar contraseña, que el usuario exista en Firestore con status active, y el mensaje exacto de error en consola/servidor.
