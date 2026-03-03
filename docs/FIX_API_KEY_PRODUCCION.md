# Fix: "API key not valid" en producción

## Diagnóstico
- Login directo (cliente) → falla con `network-request-failed` (dominio no autorizado)
- Login vía backend → 401 "API key not valid"

**Causa:** La variable `NEXT_PUBLIC_FIREBASE_API_KEY` en producción está vacía, incorrecta o no llega al servidor en runtime.

## Solución (Firebase App Hosting)

### 1. Obtener el API Key correcto
1. Firebase Console → [heartlink-f4ftq](https://console.firebase.google.com/project/heartlink-f4ftq/settings/general)
2. ⚙️ **Configuración del proyecto** → pestaña **General**
3. Sección **Tus apps** → tu app web
4. Copiar el valor de **apiKey** (algo como `AIzaSy...`)

### 2. Actualizar el secreto
Firebase App Hosting usa **Google Cloud Secret Manager**.

1. [Google Cloud Console](https://console.cloud.google.com/) → proyecto **heartlink-f4ftq**
2. **Security** → **Secret Manager**
3. Buscar el secreto **NEXT_PUBLIC_FIREBASE_API_KEY**
4. **Nueva versión** → pegar el apiKey correcto → **Guardar**

### 3. Si usás Cloud Run directamente
En **Cloud Run** → tu servicio → **Edit & Deploy New Revision** → **Variables & Secrets**:

Agregar:
- **Nombre:** `FIREBASE_API_KEY`
- **Valor:** el apiKey de Firebase (AIzaSy...)

El backend ahora usa `FIREBASE_API_KEY` en runtime (no depende del build).

### 4. Redeploy
Después de actualizar secretos, hacer un nuevo deploy para que tome efecto.

---

## Verificación
En la consola del navegador (F12) en la app de producción:
```javascript
// Si ves "" o undefined, el build no tenía la variable
console.log(document.querySelector('script#__NEXT_DATA__')?.textContent?.slice(0,200))
```

O probar login: si el backend devuelve 401, revisar los logs del servicio en Cloud Run / App Hosting para ver el error exacto.
