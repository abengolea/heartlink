# 🚀 HeartLink - Guía de Deployment

Esta guía te llevará paso a paso para hacer deploy de la aplicación HeartLink a Firebase.

## 📋 Prerrequisitos

- Node.js 18+ instalado
- Cuenta de Firebase activa
- Acceso al proyecto `heartlink-f4ftq` en Firebase Console

## 🔧 Configuración Inicial

### 1. Instalar Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Autenticación con Firebase

#### Opción A: Login Interactivo (Recomendado)
```bash
firebase login
```

#### Opción B: Token CI/CD
```bash
firebase login:ci
# Guarda el token generado para usar en CI/CD
```

#### Opción C: Service Account (Para producción)
1. Ve a [Firebase Console](https://console.firebase.google.com/project/heartlink-f4ftq/settings/serviceaccounts/adminsdk)
2. Genera una nueva clave privada
3. Descarga el archivo JSON
4. Configura la variable de entorno:
```bash
export GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account.json"
```

## 🚀 Métodos de Deployment

### Método 1: Script Automático (Recomendado)

Usa el script completo que hemos preparado:

```bash
./deploy-complete.sh
```

Este script:
- ✅ Verifica todos los prerrequisitos
- ✅ Instala dependencias
- ✅ Construye la aplicación
- ✅ Despliega Functions, Storage Rules y Database Rules
- ✅ Proporciona instrucciones para App Hosting

### Método 2: Comandos Manuales

1. **Instalar dependencias:**
```bash
npm install
cd functions && npm install && cd ..
```

2. **Construir aplicación:**
```bash
npm run build
```

3. **Deploy componentes individuales:**
```bash
# Deploy Functions
firebase deploy --only functions --project heartlink-f4ftq

# Deploy Storage Rules
firebase deploy --only storage --project heartlink-f4ftq

# Deploy Database Rules
firebase deploy --only database --project heartlink-f4ftq
```

### Método 3: GitHub Actions (Automático)

El repositorio incluye una GitHub Action que se ejecuta automáticamente en cada push a `main`.

**Configuración necesaria en GitHub Secrets:**
- `FIREBASE_SERVICE_ACCOUNT_HEARTLINK_F4FTQ`: Service Account JSON
- `FIREBASE_TOKEN`: Token generado con `firebase login:ci`

## 🌐 App Hosting (Next.js)

Para la aplicación Next.js, Firebase App Hosting requiere configuración manual:

1. Ve a [Firebase Console](https://console.firebase.google.com/project/heartlink-f4ftq)
2. Navega a **Hosting > App Hosting**
3. Crea un nuevo backend o actualiza el existente
4. Conecta tu repositorio de GitHub
5. Configura auto-deploy en push a `main`

### Configuración del Backend

El archivo `apphosting.yaml` ya está configurado con:
- Máximo 1 instancia (ajustable según necesidades)
- Configuración optimizada para Next.js

## 🔍 Verificación del Deploy

Después del deploy exitoso, verifica:

### URLs de la aplicación:
- **App Hosting:** https://heartlink-f4ftq.web.app
- **Functions:** https://us-central1-heartlink-f4ftq.cloudfunctions.net

### Comandos de verificación:
```bash
# Listar proyectos
firebase projects:list

# Ver status del deploy
firebase list --project heartlink-f4ftq

# Ver logs de Functions
firebase functions:log --project heartlink-f4ftq
```

## 🐛 Troubleshooting

### Error: "Not authenticated"
```bash
firebase login
# o
firebase login --reauth
```

### Error: "Build failed"
```bash
# Limpiar dependencias
rm -rf node_modules package-lock.json
rm -rf functions/node_modules functions/package-lock.json

# Reinstalar
npm install
cd functions && npm install && cd ..

# Intentar build nuevamente
npm run build
```

### Error: "Permission denied"
Verifica que tu cuenta tenga permisos de Editor o Owner en el proyecto Firebase.

### Error: "Functions deployment failed"
```bash
# Verificar logs
firebase functions:log --project heartlink-f4ftq

# Deploy solo functions con más información
firebase deploy --only functions --project heartlink-f4ftq --debug
```

## 📊 Estado Actual del Proyecto

### ✅ Completado:
- Merge de ramas activas a main
- Build exitoso de la aplicación
- Configuración de Firebase Functions
- Scripts de deployment automatizados
- GitHub Actions configuradas

### 🔄 Pendiente:
- Autenticación con Firebase (requiere login manual)
- Configuración de App Hosting en Firebase Console
- Configuración de secrets en GitHub

## 🎯 Próximos Pasos

1. **Autenticación:** Ejecuta `firebase login` para autenticarte
2. **Deploy inicial:** Ejecuta `./deploy-complete.sh` para el primer deploy
3. **App Hosting:** Configura manualmente en Firebase Console
4. **Verificación:** Verifica que la app esté funcionando en las URLs proporcionadas

## 📞 Soporte

Si encuentras algún problema:
1. Revisa los logs con `firebase functions:log`
2. Verifica la configuración en Firebase Console
3. Consulta la documentación oficial de Firebase
4. Verifica que todas las variables de entorno estén configuradas

---

**¡El proyecto está listo para deploy! Solo falta la autenticación manual con Firebase.**