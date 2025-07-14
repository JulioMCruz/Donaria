'use client'

// This file is only for client-side use
const isTestnet = process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'testnet'

export async function getServer() {
  const { Horizon } = await import('@stellar/stellar-sdk')
  return isTestnet 
    ? new Horizon.Server('https://horizon-testnet.stellar.org')
    : new Horizon.Server('https://horizon.stellar.org')
}

export async function getNetworkPassphrase() {
  const { Networks } = await import('@stellar/stellar-sdk')
  return isTestnet 
    ? Networks.TESTNET 
    : Networks.PUBLIC
}

export async function generateWallet(): Promise<{ publicKey: string; privateKey: string }> {
  const { Keypair } = await import('@stellar/stellar-sdk')
  const keypair = Keypair.random()
  return {
    publicKey: keypair.publicKey(),
    privateKey: keypair.secret()
  }
}

export async function getAccountInfo(publicKey: string) {
  try {
    console.log('🔍 Loading account info for:', publicKey)
    const server = await getServer()
    const account = await server.loadAccount(publicKey)
    const xlmBalance = account.balances.find((b: any) => b.asset_type === 'native')
    
    console.log('✅ Account loaded successfully:')
    console.log('- Balance:', xlmBalance?.balance || '0')
    console.log('- Sequence:', account.sequence)
    console.log('- Subentries:', account.subentryCount)
    
    return {
      balance: xlmBalance?.balance || '0',
      sequence: account.sequence,
      exists: true,
      balances: account.balances,
      subentryCount: account.subentryCount
    }
  } catch (error) {
    // Account not found is expected for new accounts - handle silently
    if (error instanceof Error && error.message.includes('Not Found')) {
      console.log('ℹ️ Account not yet funded:', publicKey.slice(0, 8) + '...')
      return {
        balance: '0',
        sequence: '0',
        exists: false,
        balances: [],
        subentryCount: 0
      }
    }
    
    console.log('❌ Failed to load account:', error)
    console.log('- Public key:', publicKey)
    return {
      balance: '0',
      sequence: '0',
      exists: false,
      balances: [],
      subentryCount: 0
    }
  }
}

export async function sendPayment(
  sourceSecret: string,
  destinationId: string,
  amount: string,
  memo?: string
) {
  try {
    const { Keypair, TransactionBuilder, BASE_FEE, Operation, Asset, Memo } = await import('@stellar/stellar-sdk')
    const server = await getServer()
    const networkPassphrase = await getNetworkPassphrase()
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

export function formatXLM(amount: string): string {
  const num = parseFloat(amount)
  if (num === 0) return '0'
  if (num < 0.01) return '< 0.01'
  return num.toFixed(2)
}

export function getExplorerUrl(publicKey: string): string {
  const baseUrl = isTestnet 
    ? 'https://stellarexpert.io/explorer/testnet' 
    : 'https://stellarexpert.io/explorer/public'
  return `${baseUrl}/account/${publicKey}`
}

export function getTransactionUrl(hash: string): string {
  const baseUrl = isTestnet 
    ? 'https://stellarexpert.io/explorer/testnet' 
    : 'https://stellarexpert.io/explorer/public'
  return `${baseUrl}/tx/${hash}`
}