import { NextRequest, NextResponse } from 'next/server'

const isTestnet = process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'testnet'
const fundingSecret = process.env.STELLAR_FUNDING_SECRET!
const fundingAmount = process.env.STELLAR_FUNDING_AMOUNT || '1'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting funding process...')
    
    // Dynamic import of Stellar SDK to avoid SSR issues
    const { Horizon, Keypair, Networks, TransactionBuilder, BASE_FEE, Operation } = await import('@stellar/stellar-sdk')
    console.log('✅ Stellar SDK imported successfully')

    const { publicKey } = await request.json()
    console.log('📝 Request data:', { publicKey: publicKey?.substring(0, 10) + '...' })

    if (!publicKey) {
      console.log('❌ No public key provided')
      return NextResponse.json(
        { error: 'Public key is required' },
        { status: 400 }
      )
    }

    if (!fundingSecret) {
      console.log('❌ No funding secret configured')
      return NextResponse.json(
        { error: 'Funding wallet not configured' },
        { status: 500 }
      )
    }

    console.log('🔍 Validating public key...')
    // Validate public key
    try {
      Keypair.fromPublicKey(publicKey)
      console.log('✅ Public key is valid')
    } catch (error) {
      console.log('❌ Invalid public key:', error)
      return NextResponse.json(
        { error: 'Invalid public key' },
        { status: 400 }
      )
    }

    console.log('🔑 Creating funding keypair...')
    const fundingKeypair = Keypair.fromSecret(fundingSecret)
    console.log('✅ Funding keypair created, public key:', fundingKeypair.publicKey())
    
    try {
      console.log('🌐 Creating server instance...')
      // Create server instance
      const server = isTestnet 
        ? new Horizon.Server('https://horizon-testnet.stellar.org')
        : new Horizon.Server('https://horizon.stellar.org')
      console.log(`✅ Server created for ${isTestnet ? 'testnet' : 'mainnet'}`)

      const networkPassphrase = isTestnet 
        ? Networks.TESTNET 
        : Networks.PUBLIC
      console.log('✅ Network passphrase set:', networkPassphrase)
      
      console.log('🔍 Loading funding account...')
      // Load funding account
      const fundingAccount = await server.loadAccount(fundingKeypair.publicKey())
      console.log('✅ Funding account loaded, balance:', fundingAccount.balances[0]?.balance)
      
      console.log('🏗️ Building transaction...')
      // Build create account transaction
      const transaction = new TransactionBuilder(fundingAccount, {
        fee: BASE_FEE,
        networkPassphrase,
      })
        .addOperation(Operation.createAccount({
          destination: publicKey,
          startingBalance: fundingAmount,
        }))
        .setTimeout(180)
        .build()
      console.log('✅ Transaction built with amount:', fundingAmount)

      console.log('✍️ Signing transaction...')
      // Sign and submit
      transaction.sign(fundingKeypair)
      console.log('✅ Transaction signed')
      
      console.log('📡 Submitting transaction...')
      const result = await server.submitTransaction(transaction)
      console.log('✅ Transaction submitted successfully:', result.hash)
      
      return NextResponse.json({
        success: true,
        transactionHash: result.hash,
        amount: fundingAmount
      })
    } catch (error: unknown) {
      console.log('❌ Funding transaction error:', error)
      console.log('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        status: (error as any)?.response?.status,
        data: (error as any)?.response?.data
      })
      
      // Handle account already exists
      if ((error as Error & { response?: { data?: { extras?: { result_codes?: { operations?: string[] } } } } })?.response?.data?.extras?.result_codes?.operations?.includes('op_already_exists')) {
        console.log('ℹ️ Account already exists')
        return NextResponse.json({
          success: false,
          error: 'Account already exists'
        })
      }
      
      console.error('Funding error:', error)
      return NextResponse.json(
        { error: 'Failed to fund account', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Funding API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}