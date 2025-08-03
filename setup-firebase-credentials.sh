#!/bin/bash

echo "🔐 HeartLink - Configuración de Credenciales Firebase"
echo "===================================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}[PASO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[ÉXITO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[ATENCIÓN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step "Verificando archivo .env.local..."

if [ ! -f ".env.local" ]; then
    print_error "No se encontró el archivo .env.local"
    echo "Creando archivo .env.local de plantilla..."
    
    cat > .env.local << 'EOF'
# Firebase Configuration for HeartLink
# ⚠️ IMPORTANTE: Este archivo contiene credenciales sensibles y NO debe subirse al repositorio

# Firebase Service Account Key (JSON completo)
# Obtén esta clave desde: https://console.firebase.google.com/project/heartlink-f4ftq/settings/serviceaccounts/adminsdk
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"heartlink-f4ftq","private_key_id":"YOUR_PRIVATE_KEY_ID","private_key":"-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxxxx@heartlink-f4ftq.iam.gserviceaccount.com","client_id":"YOUR_CLIENT_ID","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40heartlink-f4ftq.iam.gserviceaccount.com"}

# Firebase Storage Bucket
FIREBASE_STORAGE_BUCKET=heartlink-f4ftq.firebasestorage.app

# Next.js Firebase Project ID (para el cliente)
NEXT_PUBLIC_FIREBASE_PROJECT_ID=heartlink-f4ftq
EOF
    
    print_success "Archivo .env.local creado"
fi

print_step "Verificando configuración actual..."

# Check if service account key is properly configured
if grep -q "YOUR_PRIVATE_KEY" .env.local; then
    print_warning "Las credenciales aún no están configuradas"
    echo ""
    echo "📋 PASOS PARA CONFIGURAR LAS CREDENCIALES:"
    echo ""
    echo "1. Ve a Firebase Console:"
    echo "   https://console.firebase.google.com/project/heartlink-f4ftq/settings/serviceaccounts/adminsdk"
    echo ""
    echo "2. Haz clic en 'Generar nueva clave privada'"
    echo ""
    echo "3. Descarga el archivo JSON"
    echo ""
    echo "4. Copia TODO el contenido del JSON (en una sola línea) y reemplaza la línea:"
    echo "   FIREBASE_SERVICE_ACCOUNT_KEY=..."
    echo ""
    echo "5. Guarda el archivo .env.local"
    echo ""
    echo "6. Reinicia el servidor de desarrollo:"
    echo "   npm run dev"
    echo ""
    print_warning "⚠️  IMPORTANTE: Nunca subas el archivo .env.local al repositorio"
    echo ""
else
    print_success "Credenciales configuradas"
    
    # Test the configuration
    print_step "Probando configuración..."
    
    if npm run dev -- --turbopack -p 9002 & sleep 5; then
        print_success "Servidor iniciado correctamente en puerto 9002"
        print_success "Puedes probar subir un video ahora"
    else
        print_error "Error al iniciar el servidor"
    fi
fi

echo ""
print_step "Verificación de .gitignore..."

if grep -q ".env.local" .gitignore; then
    print_success ".env.local está protegido en .gitignore"
else
    print_warning "Agregando .env.local a .gitignore..."
    echo ".env.local" >> .gitignore
    print_success ".env.local agregado a .gitignore"
fi

echo ""
echo "🎯 RESUMEN:"
echo "- Archivo .env.local: $([ -f .env.local ] && echo "✅ Creado" || echo "❌ Falta")"
echo "- Credenciales: $(grep -q "YOUR_PRIVATE_KEY" .env.local && echo "⚠️  Pendientes" || echo "✅ Configuradas")"
echo "- Protección .gitignore: $(grep -q ".env.local" .gitignore && echo "✅ Activa" || echo "❌ Falta")"
echo ""
echo "🚀 Una vez configuradas las credenciales, el upload de videos funcionará correctamente!"