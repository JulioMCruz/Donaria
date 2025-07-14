import { NextRequest, NextResponse } from 'next/server'

const isTestnet = process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'testnet'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const publicKey = searchParams.get('publicKey')

    if (!publicKey) {
      return NextResponse.json(
        { error: 'publicKey parameter is required' },
        { status: 400 }
      )
    }

    // Dynamic import of Stellar SDK
    const StellarSdk = await import('@stellar/stellar-sdk')
    
    // Create server instance
    const server = isTestnet 
      ? new StellarSdk.Server('https://horizon-testnet.stellar.org')
      : new StellarSdk.Server('https://horizon.stellar.org')

    console.log('🔍 Debug: Loading account for:', publicKey)
    console.log('🌐 Network:', isTestnet ? 'testnet' : 'mainnet')
    console.log('🌐 Server URL:', isTestnet ? 'https://horizon-testnet.stellar.org' : 'https://horizon.stellar.org')

    try {
      const account = await server.loadAccount(publicKey)
      const xlmBalance = account.balances.find(b => b.asset_type === 'native')
      
      const result = {
        success: true,
        network: isTestnet ? 'testnet' : 'mainnet',
        publicKey,
        account: {
          id: account.accountId(),
          sequence: account.sequence,
          subentryCount: account.subentryCount,
          balances: account.balances,
          xlmBalance: xlmBalance?.balance || '0'
        },
        explorerUrl: `https://stellarexpert.io/explorer/${isTestnet ? 'testnet' : 'public'}/account/${publicKey}`
      }
      
      console.log('✅ Debug: Account loaded successfully:', result)
      return NextResponse.json(result)
      
    } catch (error: any) {
      console.log('❌ Debug: Failed to load account:', error)
      
      if (error.response?.status === 404) {
        return NextResponse.json({
          success: false,
          network: isTestnet ? 'testnet' : 'mainnet',
          publicKey,
          error: 'Account not found',
          explorerUrl: `https://stellarexpert.io/explorer/${isTestnet ? 'testnet' : 'public'}/account/${publicKey}`,
          suggestion: 'Account may not exist on this network or may not be funded yet'
        })
      }
      
      throw error
    }
  } catch (error: any) {
    console.error('Debug API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to load account',
        details: error.message,
        network: isTestnet ? 'testnet' : 'mainnet'
      },
      { status: 500 }
    )
  }
}