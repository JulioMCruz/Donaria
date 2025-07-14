import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { decryptPrivateKey } from '@/lib/crypto'

export async function POST(request: NextRequest) {
  try {
    const { firebaseUid, pin } = await request.json()

    if (!firebaseUid || !pin) {
      return NextResponse.json(
        { error: 'firebaseUid and pin are required' },
        { status: 400 }
      )
    }

    console.log('🔐 Attempting to unlock wallet for user:', firebaseUid)

    // Get user's encrypted wallet
    const usersRef = adminDb.collection('users')
    const query = await usersRef.where('firebaseUid', '==', firebaseUid).limit(1).get()
    
    if (query.empty) {
      console.log('❌ User not found:', firebaseUid)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const doc = query.docs[0]
    const userData = doc.data()
    const encryptedWallet = userData.encryptedWallet

    if (!encryptedWallet) {
      console.log('❌ No encrypted wallet found for user:', firebaseUid)
      return NextResponse.json(
        { error: 'No wallet found' },
        { status: 404 }
      )
    }

    // Try to decrypt the wallet with the provided PIN
    try {
      console.log('🔓 Attempting to decrypt wallet...')
      const privateKey = decryptPrivateKey(encryptedWallet, pin)
      
      // Verify the private key by deriving the public key
      const { Keypair } = await import('@stellar/stellar-sdk')
      const keypair = Keypair.fromSecret(privateKey)
      const publicKey = keypair.publicKey()
      
      console.log('✅ Wallet unlocked successfully, public key:', publicKey.substring(0, 10) + '...')
      
      return NextResponse.json({
        success: true,
        publicKey,
        privateKey
      })
      
    } catch (decryptError) {
      console.log('❌ Invalid PIN for user:', firebaseUid)
      return NextResponse.json(
        { error: 'Invalid PIN' },
        { status: 401 }
      )
    }

  } catch (error) {
    console.error('❌ Unlock wallet error:', error)
    return NextResponse.json(
      { error: 'Failed to unlock wallet' },
      { status: 500 }
    )
  }
}