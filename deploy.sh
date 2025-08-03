#!/bin/bash

echo "🚀 Starting deployment process for HeartLink"
echo "==============================================="

# Check if Firebase CLI is available
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Check if user is logged in
echo "🔐 Checking Firebase authentication..."
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not authenticated with Firebase. Please run:"
    echo "   firebase login"
    echo "   Then run this script again."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building the application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi

# Deploy to Firebase
echo "🚀 Deploying to Firebase..."
echo "Project: heartlink-f4ftq"

# Deploy Firebase Functions
echo "📡 Deploying Firebase Functions..."
firebase deploy --only functions

# Deploy Firebase Hosting (App Hosting)
echo "🌐 Deploying App Hosting..."
firebase apphosting:backend:create --project heartlink-f4ftq

# Deploy Storage Rules
echo "💾 Deploying Storage Rules..."
firebase deploy --only storage

# Deploy Database Rules
echo "🗄️ Deploying Database Rules..."
firebase deploy --only database

echo "✅ Deployment completed successfully!"
echo "🌍 Your app should be available at: https://heartlink-f4ftq.web.app"