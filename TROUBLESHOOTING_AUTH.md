# Error al iniciar sesión en producción

## Síntoma
- Login funciona en **local** (localhost)
- Login **falla en producción** con el mismo usuario y contraseña

## Causa más común: Dominio no autorizado

Firebase Auth solo permite login desde dominios que estén en la lista de **Authorized domains**.

## Solución

1. Ve a **Firebase Console** → [Authentication → Settings → Authorized domains](https://console.firebase.google.com/project/heartlink-f4ftq/authentication/settings)

2. Haz clic en **"Add domain"**

3. Agrega estos dominios (si no están ya):
   - `heartlink--heartlink-f4ftq.us-central1.hosted.app`
   - `heartlink-f4ftq.web.app`
   - `t-357605249---heartlink-j3bsekel4a-uc.a.run.app` (Cloud Run, si aplica)

4. Guarda los cambios

5. **Espera 1–2 minutos** y vuelve a intentar iniciar sesión

---

## Otras posibles causas

### "Usuario no registrado"
Si el login de Firebase funciona pero ves "Usuario no registrado" o "Tu cuenta está autenticada, pero no tienes un perfil en nuestra base de datos":
- El usuario existe en Firebase Auth pero no en Firestore (colección `users`)
- Verifica que el usuario esté en Firestore con el mismo email

### "Cuenta pendiente de aprobación"
- El usuario está en Firestore con `status: "pending_approval"`
- Un admin debe aprobar el usuario en el panel de administración

### auth/network-request-failed
El navegador no puede conectar con Firebase. La app tiene **fallback automático**: si el login directo falla, intenta vía backend (el servidor sí puede alcanzar Google). Debería funcionar sin que hagas nada.

Si aún falla, prueba:
1. **Desactivar bloqueadores de anuncios** (uBlock, AdBlock, Privacy Badger) para este sitio
2. **Desactivar VPN** si usas una
3. **Probar otra red** (ej. datos móviles en lugar de WiFi)
4. **Probar en modo incógnito** (sin extensiones)
5. **Probar otro navegador** (Chrome, Firefox, Edge)

### Recuperar contraseña: no llega el email
El flujo "¿Olvidaste tu contraseña?" genera una **nueva contraseña** (no un enlace) y la envía por correo vía **Firestore Trigger Email** (Gmail SMTP).

Si no recibes el email:
1. **Revisa la carpeta de spam/correo no deseado**
2. Verifica que la extensión **Firestore Trigger Email** esté instalada y configurada (extensions/firestore-send-email.env)
3. Prueba el envío con Admin → "Probar Trigger Mail" para confirmar que los emails funcionan
4. El email se envía desde la cuenta configurada en SMTP_CONNECTION_URI (p. ej. abengolea1@gmail.com)

### Ver el error exacto
Abre la consola del navegador (F12 → Console) al intentar iniciar sesión. El mensaje de error te dará más pistas:
- `auth/unauthorized-domain` → dominio no autorizado (ver arriba)
- `auth/network-request-failed` → problema de red o bloqueo (ver arriba)
- `auth/invalid-api-key` → API key incorrecta en producción
- `auth/user-not-found` → no existe cuenta con ese email
