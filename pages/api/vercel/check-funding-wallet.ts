import type { NextApiRequest, NextApiResponse } from 'next'

const isTestnet = process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'testnet'
const fundingSecret = process.env.STELLAR_FUNDING_SECRET!

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Dynamic import of Stellar SDK
    const StellarSdk = await import('@stellar/stellar-sdk')

    if (!fundingSecret) {
      return res.status(500).json({ error: 'Funding wallet not configured' })
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
      
      return res.status(200).json({
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
        return res.status(200).json({
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
    return res.status(500).json({ 
      error: 'Failed to check funding wallet',
      details: error.message
    })
  }
}