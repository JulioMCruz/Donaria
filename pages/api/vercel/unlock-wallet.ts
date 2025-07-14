import type { NextApiRequest, NextApiResponse } from 'next'
import { adminDb } from '@/lib/firebase-admin'
import { decryptPrivateKey } from '@/lib/crypto'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { firebaseUid, pin } = req.body

    if (!firebaseUid || !pin) {
      return res.status(400).json({ error: 'firebaseUid and pin are required' })
    }

    console.log('🔐 Attempting to unlock wallet for user:', firebaseUid)

    // Get user's encrypted wallet
    const usersRef = adminDb.collection('users')
    const query = await usersRef.where('firebaseUid', '==', firebaseUid).limit(1).get()
    
    if (query.empty) {
      console.log('❌ User not found:', firebaseUid)
      return res.status(404).json({ error: 'User not found' })
    }

    const doc = query.docs[0]
    const userData = doc.data()
    const encryptedWallet = userData.encryptedWallet

    if (!encryptedWallet) {
      console.log('❌ No encrypted wallet found for user:', firebaseUid)
      return res.status(404).json({ error: 'No wallet found' })
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
      
      return res.status(200).json({
        success: true,
        publicKey,
        privateKey
      })
      
    } catch (decryptError) {
      console.log('❌ Invalid PIN for user:', firebaseUid)
      return res.status(401).json({ error: 'Invalid PIN' })
    }

  } catch (error) {
    console.error('❌ Unlock wallet error:', error)
    return res.status(500).json({ error: 'Failed to unlock wallet' })
  }
}