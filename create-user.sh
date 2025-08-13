#!/bin/bash

echo "🔐 Creating Firebase Auth user via our API..."

# Use our own API endpoint that has the proper credentials
RESPONSE=$(curl -s -X POST https://heartlink--heartlink-f4ftq.us-central1.hosted.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "abengolea1@gmail.com",
    "password": "123456",
    "name": "Dr. Abel Bengolea"
  }')

echo "📄 API Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

# Check if successful
if echo "$RESPONSE" | grep -q '"success":true'; then
  echo ""
  echo "✅ SUCCESS! User created successfully!"
  echo "🔑 Login credentials:"
  echo "   Email: abengolea1@gmail.com" 
  echo "   Password: 123456"
  echo ""
  echo "🌐 Login at: https://heartlink--heartlink-f4ftq.us-central1.hosted.app"
else
  echo ""
  echo "❌ FAILED! Check the error above."
  echo ""
  echo "🔧 If it's still a permission error, we need to:"
  echo "   1. Enable Firebase Auth API manually"
  echo "   2. Or create user in Firebase Console"
fi