import type { NextApiRequest, NextApiResponse } from 'next'
import { 
  Contract, 
  SorobanRpc, 
  Keypair, 
  Networks, 
  TransactionBuilder,
  Address,
  nativeToScVal,
  scValToNative
} from '@stellar/stellar-sdk'

// Initialize Soroban RPC server
const server = new SorobanRpc.Server('https://soroban-testnet.stellar.org')

// Helper function to call contract methods
async function callContract(contractId: string, method: string, args: any[] = [], sourceSecret: string) {
  try {
    console.log(`🔧 Calling contract method: ${method}`)
    
    const contract = new Contract(contractId)
    const sourceKeypair = Keypair.fromSecret(sourceSecret)
    
    console.log('✍️ Executing transaction with source account')
    
    const sourceAccount = await server.getAccount(sourceKeypair.publicKey())
    
    // Build the operation
    const operation = contract.call(method, ...args)
    
    // First simulate to get the transaction
    const txBuilder = new TransactionBuilder(sourceAccount, {
      fee: '1000000', // Higher fee for contract calls
      networkPassphrase: Networks.TESTNET,
    }).addOperation(operation).setTimeout(30)
    
    const tx = txBuilder.build()
    
    // Simulate first to get auth requirements
    console.log('🔍 Simulating transaction...')
    const simulation = await server.simulateTransaction(tx)
    
    if (simulation.error) {
      throw new Error(`Simulation failed: ${simulation.error}`)
    }
    
    // If simulation was successful, prepare the real transaction
    console.log('📝 Preparing transaction with auth...')
    
    // Clone the transaction and apply auth
    let preparedTx = tx
    if (simulation.result && simulation.result.auth) {
      console.log('🔐 Applying authorization...')
      preparedTx = SorobanRpc.assembleTransaction(tx, simulation).build()
    }
    
    // Sign the transaction
    preparedTx.sign(sourceKeypair)
    
    console.log('📡 Submitting transaction...')
    const result = await server.sendTransaction(preparedTx)
    
    if (result.status === 'ERROR') {
      throw new Error(`Transaction failed: ${result.errorResult}`)
    }
    
    // Wait for confirmation
    if (result.status === 'PENDING') {
      const hash = result.hash
      console.log('⏳ Waiting for transaction confirmation...', hash)
      
      let attempts = 0
      while (attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        try {
          const txResult = await server.getTransaction(hash)
          
          if (txResult.status === 'SUCCESS') {
            console.log('✅ Transaction confirmed successfully')
            if (txResult.returnValue) {
              return scValToNative(txResult.returnValue)
            }
            return { hash, success: true }
          } else if (txResult.status === 'FAILED') {
            throw new Error(`Transaction failed: ${txResult.resultXdr}`)
          }
        } catch (error) {
          console.log(`Attempt ${attempts + 1}: Transaction not ready yet...`)
        }
        
        attempts++
      }
      throw new Error('Transaction confirmation timeout')
    }
    
    if (result.returnValue) {
      return scValToNative(result.returnValue)
    }
    
    return { hash: result.hash || null, success: true }
    
  } catch (error: any) {
    console.error('❌ Contract call failed:', error)
    throw error
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🔐 Soroban API: Storing message with app-sponsored gas')
    
    const { contractId, userAddress, message, network, privateKey } = req.body
    
    if (!contractId || !userAddress || !message || !network || !privateKey) {
      return res.status(400).json({ error: 'Missing required parameters' })
    }

    console.log('🔐 Storing message with app-sponsored gas:', {
      contractId,
      userAddress,
      message,
      network
    })

    // Get funding account private key from environment
    const fundingPrivateKey = process.env.STELLAR_FUNDING_SECRET
    if (!fundingPrivateKey) {
      throw new Error('STELLAR_FUNDING_SECRET not configured')
    }

    console.log('🔑 Processing keys and calling contract...')
    
    // Prepare contract arguments
    const contractArgs = [
      nativeToScVal(Address.fromString(userAddress), { type: 'address' }), // user
      nativeToScVal(message, { type: 'string' }) // message
    ]
    
    // Try funding account first (app-sponsored)
    let result
    let messageCount = 0
    
    try {
      console.log('💡 Using app-sponsored transaction (funding account pays fees)...')
      result = await callContract(
        contractId,
        'store_sponsored_message',
        contractArgs,
        fundingPrivateKey
      )
      
      console.log('✅ App-sponsored transaction successful')
      
    } catch (sponsoredError: any) {
      console.log('⚠️ App-sponsored transaction failed, falling back to user-paid...')
      console.log('📝 Reason:', sponsoredError.message)
      
      try {
        console.log('🔄 Fallback: User pays transaction fees...')
        result = await callContract(
          contractId,
          'store_message', // Use regular store_message instead of sponsored
          contractArgs,
          privateKey
        )
        
        console.log('✅ User-paid transaction successful')
        
      } catch (userError: any) {
        console.error('❌ Both app-sponsored and user-paid transactions failed')
        throw new Error(`Failed to store message: ${userError.message}`)
      }
    }
    
    // Parse the response - it should be a number (message count)
    try {
      if (typeof result === 'number') {
        messageCount = result
      } else if (result && typeof result === 'object' && result.messageCount) {
        messageCount = result.messageCount
      } else if (typeof result === 'string') {
        const matches = result.match(/\d+/)
        if (matches) {
          messageCount = parseInt(matches[0], 10) || 0
        }
      }
    } catch (parseError) {
      console.error('❌ Failed to parse contract response:', parseError)
      console.log('Raw response:', result)
    }
    
    console.log('✅ Message stored successfully, count:', messageCount)
    
    return res.status(200).json({
      success: true,
      messageCount: messageCount,
      userAddress: userAddress,
      message: message,
      contractId: contractId
    })

  } catch (error: any) {
    console.error('❌ Error storing message with user key:', error)
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Unknown error'
    })
  }
}