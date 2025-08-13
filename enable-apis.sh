#!/bin/bash

echo "🔧 Enabling Firebase APIs for project heartlink-f4ftq..."
echo ""

PROJECT_ID="heartlink-f4ftq"

# Check if we need to install gcloud
if ! command -v gcloud &> /dev/null; then
    echo "📦 Installing Google Cloud CLI..."
    
    # Download and install gcloud (silent)
    curl -s https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-cli-linux-x86_64.tar.gz | tar -xz
    ./google-cloud-sdk/install.sh --quiet --path-update=true
    source ~/.bashrc
    export PATH=$PATH:$(pwd)/google-cloud-sdk/bin
fi

echo "🔐 Authenticating with gcloud..."
echo "   You'll need to visit a URL and paste the verification code"

# Try to authenticate
gcloud auth login

echo ""
echo "🎯 Setting project..."
gcloud config set project $PROJECT_ID

echo ""
echo "🔥 Enabling required APIs..."

# Enable Firebase Auth API
echo "   • Firebase Authentication API..."
gcloud services enable identitytoolkit.googleapis.com

# Enable Service Usage API
echo "   • Service Usage API..."
gcloud services enable serviceusage.googleapis.com

# Enable Cloud Resource Manager API
echo "   • Cloud Resource Manager API..."
gcloud services enable cloudresourcemanager.googleapis.com

# Enable Firebase Management API
echo "   • Firebase Management API..."
gcloud services enable firebase.googleapis.com

echo ""
echo "✅ APIs enabled! Waiting 30 seconds for propagation..."
sleep 30

echo ""
echo "🧪 Testing Firebase Auth user creation..."
RESPONSE=$(curl -s -X POST https://heartlink--heartlink-f4ftq.us-central1.hosted.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "abengolea1@gmail.com",
    "password": "123456",
    "name": "Dr. Abel Bengolea"
  }')

echo "📄 API Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

if echo "$RESPONSE" | grep -q '"success":true'; then
  echo ""
  echo "🎉 SUCCESS! User created successfully!"
  echo "🔑 Login credentials:"
  echo "   Email: abengolea1@gmail.com" 
  echo "   Password: 123456"
  echo ""
  echo "🌐 Login at: https://heartlink--heartlink-f4ftq.us-central1.hosted.app"
else
  echo ""
  echo "⚠️  APIs enabled but still getting errors."
  echo "   This might take a few more minutes to propagate."
  echo "   Try the web interface:"
  echo "   https://console.firebase.google.com/project/heartlink-f4ftq/authentication/users"
fi