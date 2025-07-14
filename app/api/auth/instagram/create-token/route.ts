import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  try {
    console.log('📸 Creating Firebase custom token for Instagram user')
    
    const { uid, email, name, avatar, provider } = await request.json()
    
    if (!uid || provider !== 'instagram') {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }

    // Create a unique Firebase UID for Instagram users
    const firebaseUid = `instagram:${uid}`
    
    // Additional claims for the custom token
    const additionalClaims = {
      provider: 'instagram',
      instagram_id: uid,
      email: email || '',
      name: name || '',
      picture: avatar || '',
    }

    console.log('📸 Creating custom token with claims:', additionalClaims)

    // Create custom token
    const customToken = await adminAuth.createCustomToken(firebaseUid, additionalClaims)
    
    console.log('✅ Firebase custom token created successfully')

    return NextResponse.json({
      success: true,
      customToken,
      firebaseUid
    })

  } catch (error) {
    console.error('❌ Error creating custom token:', error)
    return NextResponse.json(
      { error: 'Failed to create custom token' },
      { status: 500 }
    )
  }
}