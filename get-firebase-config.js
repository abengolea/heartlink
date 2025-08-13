// Script to get real Firebase configuration
const admin = require('firebase-admin');

// This script will help us get the real Firebase config
console.log('🔍 Getting real Firebase configuration for heartlink-f4ftq...');

// For project heartlink-f4ftq, the real config should be:
const realConfig = {
  apiKey: "AIzaSyDHNOHa_HHs5JGQSgKv-0c4vWvl8BqRZgE", // This might be wrong
  authDomain: "heartlink-f4ftq.firebaseapp.com",
  projectId: "heartlink-f4ftq", 
  storageBucket: "heartlink-f4ftq.firebasestorage.app",
  messagingSenderId: "1060964824602",
  appId: "1:1060964824602:web:b9f82e7ab2ca0b64c4ac93" // This might be wrong too
};

console.log('\n📋 Current config in our apphosting.yaml:');
console.log(JSON.stringify(realConfig, null, 2));

console.log('\n🚨 The API key is likely wrong!');
console.log('🔧 We need to get the REAL API key from:');
console.log('   https://console.firebase.google.com/project/heartlink-f4ftq/settings/general');
console.log('\n📱 Look for the "Web apps" section and copy the config object.');

console.log('\n🎯 Alternative: Enable Firebase Authentication manually:');
console.log('   1. Go to: https://console.firebase.google.com/project/heartlink-f4ftq/authentication/providers');
console.log('   2. Click on "Email/Password"');
console.log('   3. Enable it');
console.log('   4. Save');

console.log('\n🔑 Then try to get a NEW API key:');
console.log('   1. Go to: https://console.cloud.google.com/apis/credentials?project=heartlink-f4ftq');
console.log('   2. Create new API key');
console.log('   3. Restrict to Firebase APIs');
console.log('   4. Use that key in apphosting.yaml');