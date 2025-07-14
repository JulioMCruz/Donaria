import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // This endpoint helps test X authentication setup
    return NextResponse.json({
      success: true,
      message: 'X (Twitter) authentication endpoint is ready',
      timestamp: new Date().toISOString(),
      info: {
        firebaseCallbackUrl: 'https://your-project-id.firebaseapp.com/__/auth/handler',
        xDeveloperPortal: 'https://developer.x.com',
        setupSteps: [
          '1. Create X Developer account',
          '2. Create X App with OAuth settings',
          '3. Add Client ID/Secret to Firebase Console',
          '4. Test X login in the app'
        ]
      }
    })
  } catch (error) {
    console.error('X auth test endpoint error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Test endpoint failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}