import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Test if we can import Firebase Admin
    const { adminDb } = await import('@/lib/firebase-admin')
    
    // Test basic Firestore connection
    const testCollection = adminDb.collection('test')
    const testDoc = await testCollection.add({
      test: true,
      timestamp: new Date().toISOString()
    })
    
    // Delete the test document
    await testDoc.delete()
    
    return NextResponse.json({
      success: true,
      message: 'Firebase Admin is working correctly',
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    })
  } catch (error) {
    console.error('Firebase test error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}