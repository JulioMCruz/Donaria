import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

// Check if we're in the browser
if (typeof window !== 'undefined') {
  throw new Error('Firebase Admin should only be used on the server side')
}

const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL

if (!projectId || !privateKey || !clientEmail) {
  console.error('Missing Firebase Admin configuration:')
  console.error('- NEXT_PUBLIC_FIREBASE_PROJECT_ID:', !!projectId)
  console.error('- FIREBASE_PRIVATE_KEY:', !!privateKey)
  console.error('- FIREBASE_CLIENT_EMAIL:', !!clientEmail)
  throw new Error('Missing Firebase Admin configuration. Please check your environment variables.')
}

const firebaseAdminConfig = {
  credential: cert({
    projectId,
    clientEmail,
    privateKey,
  }),
  projectId, // Add explicit project ID
}

// Check if admin app already exists
const adminApp = getApps().find(app => app.name === 'admin') || 
                initializeApp(firebaseAdminConfig, 'admin')

export const adminDb = getFirestore(adminApp)
export const adminAuth = getAuth(adminApp)
export default adminApp