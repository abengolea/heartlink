#!/bin/bash

echo "🔐 Setting up Firebase Secrets for API Keys..."
echo ""

echo "📋 You need to manually create these secrets in Firebase Console:"
echo ""

echo "🔑 1. Go to Firebase Console Secrets:"
echo "   https://console.firebase.google.com/project/heartlink-f4ftq/apphosting/backends"
echo ""

echo "🔑 2. Create these secrets:"
echo ""
echo "   Secret Name: NEXT_PUBLIC_FIREBASE_API_KEY"
echo "   Secret Value: AIzaSyDO-9ftR7wOY09PZ6QzL3WqBY_JTrTY5Zw"
echo ""
echo "   Secret Name: NEXT_PUBLIC_FIREBASE_APP_ID" 
echo "   Secret Value: 1:1060964824602:web:0590cb4e2a94318bacc3a3"
echo ""

echo "🔑 3. Grant access to your App Hosting backend:"
echo "   - Select your backend 'heartlink'"
echo "   - Grant access to both secrets"
echo ""

echo "🚀 4. After creating secrets, the app will deploy automatically"
echo "   and the API keys will be hidden from GitHub!"
echo ""

echo "💡 Alternative - Use Firebase CLI (if authenticated):"
echo ""
echo "   npx firebase-tools apphosting:secrets:set NEXT_PUBLIC_FIREBASE_API_KEY"
echo "   npx firebase-tools apphosting:secrets:set NEXT_PUBLIC_FIREBASE_APP_ID" 
echo ""

echo "✅ Once secrets are set, login should work at:"
echo "   https://heartlink--heartlink-f4ftq.us-central1.hosted.app"