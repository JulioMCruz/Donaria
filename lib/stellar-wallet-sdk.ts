'use client'

// Initialize Stellar Wallet SDK client-side only
export const getStellarWallet = async () => {
  const { Wallet } = await import('@stellar/wallet-sdk')
  const config = await getStellarWalletConfig()
  return Wallet.create(config)
}

// Stellar Wallet SDK configuration
const getStellarWalletConfig = async () => {
  const isTestnet = process.env.NEXT_PUBLIC_STELLAR_NETWORK === 'testnet'
  const StellarSDK = await import('@stellar/stellar-sdk')
  const networkPassphrase = isTestnet 
    ? StellarSDK.Networks.TESTNET 
    : StellarSDK.Networks.PUBLIC
    
  return {
    stellarNetworkUrl: isTestnet 
      ? 'https://horizon-testnet.stellar.org'
      : 'https://horizon.stellar.org',
    stellarNetworkPassphrase: networkPassphrase,
  }
}

// SEP-24 Integration
export async function initializeDepositWithdraw(
  authToken: string,
  assetCode: string,
  anchorDomain: string
) {
  try {
    const stellarWallet = await getStellarWallet()
    const anchor = stellarWallet.anchor({ 
      anchorDomain,
      authToken 
    })
    
    // Get anchor info
    const anchorInfo = await anchor.getInfo()
    
    return {
      anchor,
      anchorInfo,
      depositEnabled: anchorInfo.deposit?.[assetCode]?.enabled,
      withdrawEnabled: anchorInfo.withdraw?.[assetCode]?.enabled
    }
  } catch (error) {
    throw new Error(`Failed to initialize anchor: ${error}`)
  }
}

// Interactive deposit (SEP-24)
export async function startInteractiveDeposit(
  anchor: any,
  assetCode: string,
  account: string
) {
  try {
    const depositResponse = await anchor.deposit({
      assetCode,
      account,
      lang: 'en'
    })
    
    return depositResponse
  } catch (error) {
    throw new Error(`Deposit failed: ${error}`)
  }
}

// Interactive withdrawal (SEP-24)
export async function startInteractiveWithdraw(
  anchor: any,
  assetCode: string,
  account: string
) {
  try {
    const withdrawResponse = await anchor.withdraw({
      assetCode,
      account,
      lang: 'en'
    })
    
    return withdrawResponse
  } catch (error) {
    throw new Error(`Withdrawal failed: ${error}`)
  }
}

// Monitor transaction status
export async function monitorTransaction(
  anchor: any,
  transactionId: string
) {
  try {
    const transaction = await anchor.getTransactionBy({
      id: transactionId
    })
    
    return transaction
  } catch (error) {
    throw new Error(`Failed to get transaction: ${error}`)
  }
}