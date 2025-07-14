import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export interface UserProfile {
  id?: string
  firebaseUid: string
  email?: string
  name?: string
  avatar?: string
  provider: string
  walletAddress?: string
  createdAt?: string
  updatedAt?: string
}

// GET /api/users/by-wallet?walletAddress=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('walletAddress')

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'walletAddress parameter is required' },
        { status: 400 }
      )
    }

    console.log('🔍 Looking up user by wallet address:', walletAddress.substring(0, 10) + '...')

    const usersRef = adminDb.collection('users')
    const query = await usersRef.where('walletAddress', '==', walletAddress).limit(1).get()
    
    if (query.empty) {
      console.log('⚠️ No user found with wallet address:', walletAddress.substring(0, 10) + '...')
      return NextResponse.json({
        exists: false,
        user: null
      })
    }

    const doc = query.docs[0]
    const user = { id: doc.id, ...doc.data() } as UserProfile
    
    console.log('✅ User found:', user.name || 'No name', user.email || 'No email')
    
    return NextResponse.json({
      exists: true,
      user: {
        id: user.id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        provider: user.provider,
        walletAddress: user.walletAddress,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }
    })
  } catch (error) {
    console.error('Get user by wallet error:', error)
    return NextResponse.json(
      { error: 'Failed to get user by wallet address' },
      { status: 500 }
    )
  }
}