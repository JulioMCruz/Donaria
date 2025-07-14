import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

// Import the sendPayment function from stellar-client
async function sendPayment(
  sourceSecret: string,
  destinationId: string,
  amount: string,
  memo?: string
) {
  try {
    const { Keypair, TransactionBuilder, BASE_FEE, Operation, Asset, Memo, Networks, Horizon } = await import('@stellar/stellar-sdk')
    
    const isTestnet = true // We're always using testnet
    const server = isTestnet 
      ? new Horizon.Server('https://horizon-testnet.stellar.org')
      : new Horizon.Server('https://horizon.stellar.org')
    
    const networkPassphrase = isTestnet 
      ? Networks.TESTNET 
      : Networks.PUBLIC
    
    const sourceKeypair = Keypair.fromSecret(sourceSecret)
    const sourceAccount = await server.loadAccount(sourceKeypair.publicKey())
    
    const transactionBuilder = new TransactionBuilder(sourceAccount, {
      fee: BASE_FEE,
      networkPassphrase,
    })
      .addOperation(Operation.payment({
        destination: destinationId,
        asset: Asset.native(),
        amount: amount,
      }))
      .setTimeout(180)
    
    if (memo) {
      transactionBuilder.addMemo(Memo.text(memo))
    }
    
    const transaction = transactionBuilder.build()
    transaction.sign(sourceKeypair)
    
    const result = await server.submitTransaction(transaction)
    
    return {
      hash: result.hash,
      success: true
    }
  } catch (error) {
    return {
      hash: '',
      success: false,
      error: error instanceof Error ? error.message : 'Payment failed'
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('💰 Processing donation request...')
    
    const body = await request.json()
    const {
      needId,
      amount,
      fromWallet,
      toWallet,
      donorPrivateKey,
      donorFirebaseUid
    } = body

    // Validate required fields
    if (!needId || !amount || !fromWallet || !toWallet || !donorPrivateKey || !donorFirebaseUid) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      )
    }

    console.log('📝 Donation details:', {
      needId,
      amount,
      fromWallet: fromWallet.substring(0, 10) + '...',
      toWallet: toWallet.substring(0, 10) + '...',
      donorFirebaseUid
    })

    // Send payment using Stellar SDK
    console.log('💸 Sending payment using Stellar SDK...')
    
    const paymentResult = await sendPayment(
      donorPrivateKey,
      toWallet,
      amount.toString(),
      `Donation for need ${needId}`
    )
    
    if (!paymentResult.success) {
      console.error('❌ Payment failed:', paymentResult.error)
      return NextResponse.json({
        success: false,
        error: paymentResult.error || 'Payment failed'
      }, { status: 500 })
    }
    
    console.log('✅ Payment sent successfully, hash:', paymentResult.hash)
    
    // Store donation record in database
    console.log('💾 Storing donation record...')
    
    const donationRecord = {
      needId,
      amount,
      fromWallet,
      toWallet,
      donorFirebaseUid,
      transactionHash: paymentResult.hash,
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    const donationsRef = adminDb.collection('donations')
    const donationDoc = await donationsRef.add(donationRecord)
    
    console.log('✅ Donation record stored with ID:', donationDoc.id)
    
    return NextResponse.json({
      success: true,
      donationId: donationDoc.id,
      transactionHash: paymentResult.hash,
      amount,
      message: `Successfully donated ${amount} XLM`,
      fromWallet,
      toWallet
    })

  } catch (error: any) {
    console.error('❌ Error processing donation:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to process donation',
      details: error.toString()
    }, { status: 500 })
  }
}