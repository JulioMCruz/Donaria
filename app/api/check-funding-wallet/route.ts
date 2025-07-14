import { NextRequest, NextResponse } from 'next/server'

const isTestnet = process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'testnet'
const fundingSecret = process.env.STELLAR_FUNDING_SECRET!

export async function GET(request: NextRequest) {
  try {
    // Dynamic import of Stellar SDK
    const StellarSdk = await import('@stellar/stellar-sdk')

    if (!fundingSecret) {
      return NextResponse.json(
        { error: 'Funding wallet not configured' },
        { status: 500 }
      )
    }

    const fundingKeypair = StellarSdk.Keypair.fromSecret(fundingSecret)
    const fundingPublicKey = fundingKeypair.publicKey()
    
    // Create server instance
    const server = isTestnet 
      ? new StellarSdk.Server('https://horizon-testnet.stellar.org')
      : new StellarSdk.Server('https://horizon.stellar.org')

    try {
      // Load funding account
      const fundingAccount = await server.loadAccount(fundingPublicKey)
      const xlmBalance = fundingAccount.balances.find(b => b.asset_type === 'native')
      
      return NextResponse.json({
        success: true,
        network: isTestnet ? 'testnet' : 'mainnet',
        fundingWallet: {
          publicKey: fundingPublicKey,
          balance: xlmBalance?.balance || '0',
          accountExists: true
        },
        fundingAmount: process.env.STELLAR_FUNDING_AMOUNT || '1',
        minRequired: '1.0000000' // Minimum 1 XLM to create account
      })
    } catch (error: any) {
      // Account doesn't exist
      if (error.response?.status === 404) {
        return NextResponse.json({
          success: false,
          network: isTestnet ? 'testnet' : 'mainnet',
          fundingWallet: {
            publicKey: fundingPublicKey,
            balance: '0',
            accountExists: false
          },
          error: 'Funding wallet account does not exist. Please fund it with testnet XLM.',
          fundBotUrl: isTestnet ? 'https://laboratory.stellar.org/#account-creator' : null
        })
      }
      
      throw error
    }
  } catch (error: any) {
    console.error('Check funding wallet error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to check funding wallet',
        details: error.message
      },
      { status: 500 }
    )
  }
}