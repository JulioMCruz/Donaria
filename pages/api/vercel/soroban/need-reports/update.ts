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

const NEED_REPORTS_CONTRACT_ID = process.env.NEED_REPORTS_CONTRACT_ID || 'CBJVRBD5TCCM3BF22NDZPBSMU7VON5LQZBQOW3HMTN3PFDWD2TLW34XW'
const STELLAR_FUNDING_SECRET = process.env.STELLAR_FUNDING_SECRET

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
      while (attempts < 30) { // Increased attempts for complex contracts
        await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds
        
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
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🔄 Need update API called')
    
    console.log('📝 Request body parsed:', {
      ...req.body,
      userPrivateKey: '[REDACTED]'
    })
    
    const {
      userPrivateKey,
      reportId,
      title,
      description,
      location,
      category,
      amountNeeded,
      imageUrls = [],
      reason
    } = req.body

    if (!userPrivateKey || !reportId || !reason) {
      console.log('❌ Missing required fields')
      return res.status(400).json({ 
        error: 'Missing required fields: userPrivateKey, reportId, and reason are required' 
      })
    }

    console.log('✅ All required fields present')

    if (!STELLAR_FUNDING_SECRET) {
      console.log('❌ STELLAR_FUNDING_SECRET not configured')
      return res.status(500).json({ error: 'Funding account not configured' })
    }

    console.log('✅ STELLAR_FUNDING_SECRET configured')

    // Use Stellar SDK to get keypairs directly
    console.log('🔑 Processing user key...')
    const userKeypair = Keypair.fromSecret(userPrivateKey)
    
    // Get user's public key directly from the keypair
    console.log('🔍 Getting user public key...')
    const userAddress = userKeypair.publicKey()
    console.log('✅ User address retrieved:', userAddress.substring(0, 10) + '...')

    // Convert image URLs array to Soroban vector format
    console.log('🖼️ Processing image URLs...')
    const imageUrlsVector = imageUrls.map((url: string) => nativeToScVal(url, { type: 'string' }))
    console.log('✅ Image URLs processed:', imageUrls.length, 'images')

    // Call update_report function using Stellar SDK
    console.log('🔄 Updating need report using Stellar SDK...')
    console.log('⏳ This may take a few seconds...')
    
    // Prepare contract parameters - only include defined fields
    const contractArgs = [
      nativeToScVal(parseInt(reportId), { type: 'u32' }), // report_id
      nativeToScVal(Address.fromString(userAddress), { type: 'address' }), // updater
      nativeToScVal(reason, { type: 'string' }) // reason
    ]

    // Add optional fields only if they are provided
    if (title !== undefined) {
      contractArgs.push(nativeToScVal(title, { type: 'string' }))
    }
    if (description !== undefined) {
      contractArgs.push(nativeToScVal(description, { type: 'string' }))
    }
    if (location !== undefined) {
      contractArgs.push(nativeToScVal(location, { type: 'string' }))
    }
    if (category !== undefined) {
      contractArgs.push(nativeToScVal(category, { type: 'string' }))
    }
    if (amountNeeded !== undefined) {
      contractArgs.push(nativeToScVal(amountNeeded, { type: 'u64' }))
    }
    if (imageUrls.length > 0) {
      contractArgs.push(nativeToScVal(imageUrlsVector, { type: 'vector' }))
    }
    
    // Try funding account first (app-sponsored), then fallback to user
    let result
    let transactionHash
    
    try {
      console.log('💡 Attempting app-sponsored transaction (funding account pays fees)...')
      result = await callContract(
        NEED_REPORTS_CONTRACT_ID,
        'update_report',
        contractArgs,
        STELLAR_FUNDING_SECRET!
      )
      
      console.log('✅ App-sponsored transaction successful')
      
    } catch (sponsoredError: any) {
      console.log('⚠️ App-sponsored transaction failed, falling back to user-paid...')
      console.log('📝 Reason:', sponsoredError.message)
      
      try {
        console.log('🔄 Fallback: User pays transaction fees...')
        result = await callContract(
          NEED_REPORTS_CONTRACT_ID,
          'update_report',
          contractArgs,
          userPrivateKey
        )
        
        console.log('✅ User-paid transaction successful')
        
      } catch (userError: any) {
        console.error('❌ Both app-sponsored and user-paid transactions failed')
        throw new Error(`Failed to update report: ${userError.message}`)
      }
    }
    
    // Parse the result
    let success = false
    if (typeof result === 'boolean') {
      success = result
    } else if (result && typeof result === 'object') {
      success = result.success === true
      transactionHash = result.hash
    }
    
    console.log('📋 Update result:', success)
    console.log('🔗 Transaction hash:', transactionHash || 'Not available')
    
    if (success) {
      return res.status(200).json({
        success: true,
        reportId,
        message: 'Need report updated successfully on blockchain',
        contractId: NEED_REPORTS_CONTRACT_ID,
        userAddress,
        transactionHash
      })
    } else {
      return res.status(400).json({
        success: false,
        error: 'Update operation returned false - check if you have permission to update this report'
      })
    }

  } catch (error: any) {
    console.error('❌ Error updating need report:', error)
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update need report',
      details: error.toString()
    })
  }
}