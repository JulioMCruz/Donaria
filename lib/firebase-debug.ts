export function checkFirebaseConfig() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  }

  console.log('🔧 Firebase Configuration Debug:')
  console.log('- API Key:', config.apiKey ? '✅ Set' : '❌ Missing')
  console.log('- Auth Domain:', config.authDomain ? '✅ Set' : '❌ Missing')
  console.log('- Project ID:', config.projectId ? '✅ Set' : '❌ Missing')
  console.log('- Storage Bucket:', config.storageBucket ? '✅ Set' : '❌ Missing')
  console.log('- Messaging Sender ID:', config.messagingSenderId ? '✅ Set' : '❌ Missing')
  console.log('- App ID:', config.appId ? '✅ Set' : '❌ Missing')
  
  const missingVars = Object.entries(config)
    .filter(([key, value]) => !value)
    .map(([key]) => key)
  
  if (missingVars.length > 0) {
    console.error('❌ Missing Firebase environment variables:', missingVars)
    return false
  }
  
  console.log('✅ All Firebase environment variables are set')
  return true
}