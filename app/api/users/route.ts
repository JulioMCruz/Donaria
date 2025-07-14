import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export interface User {
  id?: string
  firebaseUid: string
  email?: string
  name?: string
  avatar?: string
  provider: string
  walletAddress?: string
  encryptedWallet?: string
  funded?: boolean
  fundingTransactionHash?: string
  createdAt?: string
  updatedAt?: string
}

// GET /api/users?firebaseUid=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const firebaseUid = searchParams.get('firebaseUid')

    if (!firebaseUid) {
      return NextResponse.json(
        { error: 'firebaseUid parameter is required' },
        { status: 400 }
      )
    }

    const usersRef = adminDb.collection('users')
    const query = await usersRef.where('firebaseUid', '==', firebaseUid).limit(1).get()
    
    if (query.empty) {
      return NextResponse.json({
        exists: false,
        user: null,
        hasWallet: false
      })
    }

    const doc = query.docs[0]
    const user = { id: doc.id, ...doc.data() } as User
    
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
        encryptedWallet: user.encryptedWallet,
        funded: user.funded,
        fundingTransactionHash: user.fundingTransactionHash,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      hasWallet: !!user.encryptedWallet
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    )
  }
}

// POST /api/users
export async function POST(request: NextRequest) {
  try {
    console.log('👤 Creating/updating user...')
    const userData = await request.json()
    console.log('📝 User data received:', {
      firebaseUid: userData.firebaseUid,
      email: userData.email,
      provider: userData.provider,
      walletAddress: userData.walletAddress?.substring(0, 10) + '...'
    })
    
    // Base required fields for all providers
    const baseRequiredFields = ['firebaseUid', 'provider', 'walletAddress', 'encryptedWallet']
    const requiredFields = [...baseRequiredFields]
    
    // Email is required for all providers except Twitter/X and Instagram
    if (userData.provider !== 'twitter' && userData.provider !== 'instagram') {
      requiredFields.push('email')
    }
    
    const missingFields = requiredFields.filter(field => !userData[field])
    
    if (missingFields.length > 0) {
      console.log('❌ Missing required fields:', missingFields)
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    console.log('🔥 Connecting to Firestore...')
    const { adminDb } = await import('@/lib/firebase-admin')
    const usersRef = adminDb.collection('users')
    const timestamp = new Date().toISOString()
    
    console.log('🔍 Checking if user already exists...')
    // Check if user already exists
    const existingQuery = await usersRef.where('firebaseUid', '==', userData.firebaseUid).limit(1).get()
    console.log('✅ User existence check completed, exists:', !existingQuery.empty)
    
    const userDoc = {
      firebaseUid: userData.firebaseUid,
      email: userData.email || '',
      name: userData.name || '',
      avatar: userData.avatar || '',
      provider: userData.provider,
      walletAddress: userData.walletAddress,
      encryptedWallet: userData.encryptedWallet,
      funded: userData.funded || false,
      fundingTransactionHash: userData.fundingTransactionHash || '',
      updatedAt: timestamp,
    }

    let userId: string

    if (!existingQuery.empty) {
      // Update existing user
      console.log('🔄 Updating existing user...')
      const doc = existingQuery.docs[0]
      userId = doc.id
      await doc.ref.update(userDoc)
      console.log('✅ User updated successfully')
    } else {
      // Create new user
      console.log('➕ Creating new user...')
      const newDoc = await usersRef.add({
        ...userDoc,
        createdAt: timestamp,
      })
      userId = newDoc.id
      console.log('✅ User created successfully with ID:', userId)
    }

    console.log('✅ Returning user data...')
    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        ...userDoc,
        createdAt: existingQuery.empty ? timestamp : existingQuery.docs[0].data().createdAt,
      }
    })
  } catch (error) {
    console.error('Create/update user error:', error)
    return NextResponse.json(
      { error: 'Failed to create/update user' },
      { status: 500 }
    )
  }
}