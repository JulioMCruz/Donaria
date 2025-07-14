import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

// GET /api/users/wallet?firebaseUid=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const firebaseUid = searchParams.get('firebaseUid')

    console.log('🔍 Fetching wallet for firebaseUid:', firebaseUid)

    if (!firebaseUid) {
      return NextResponse.json(
        { error: 'firebaseUid parameter is required' },
        { status: 400 }
      )
    }

    const usersRef = adminDb.collection('users')
    const query = await usersRef.where('firebaseUid', '==', firebaseUid).limit(1).get()
    
    if (query.empty) {
      console.log('❌ No user found for firebaseUid:', firebaseUid)
      return NextResponse.json({
        exists: false,
        publicKey: null
      })
    }

    const doc = query.docs[0]
    const userData = doc.data()
    const publicKey = userData.walletAddress || null
    
    console.log('✅ Found user wallet:', publicKey ? publicKey.substring(0, 10) + '...' : 'null')
    
    return NextResponse.json({
      exists: true,
      publicKey: publicKey
    })
  } catch (error) {
    console.error('❌ Get user wallet error:', error)
    return NextResponse.json(
      { error: 'Failed to get user wallet' },
      { status: 500 }
    )
  }
}