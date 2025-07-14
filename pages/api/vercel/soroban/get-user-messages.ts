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

// Helper function to call contract methods (read-only)
async function callContract(contractId: string, method: string, args: any[] = []) {
  try {
    console.log(`🔧 Calling contract method: ${method}`)
    
    const contract = new Contract(contractId)
    
    // For read-only operations, we can use simulation
    console.log('📖 Using simulation for read-only operation')
    
    // Create a dummy source account for simulation
    const dummyKeypair = Keypair.random()
    
    // Build the operation
    const operation = contract.call(method, ...args)
    
    // Simulate the transaction
    const account = await server.getAccount(dummyKeypair.publicKey()).catch(() => {
      // If account doesn't exist, create a dummy account object
      return {
        accountId: () => dummyKeypair.publicKey(),
        sequenceNumber: () => '0',
        getKeypair: () => dummyKeypair
      }
    })
    
    const txBuilder = new TransactionBuilder(account as any, {
      fee: '100',
      networkPassphrase: Networks.TESTNET,
    }).addOperation(operation).setTimeout(30)
    
    const tx = txBuilder.build()
    
    const simulation = await server.simulateTransaction(tx)
    
    if (simulation.error) {
      throw new Error(`Simulation failed: ${simulation.error}`)
    }
    
    if (simulation.result?.retval) {
      return scValToNative(simulation.result.retval)
    }
    
    return null
    
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
    console.log('📖 Soroban API: Getting user messages from smart contract')
    
    const { contractId, userAddress, network } = req.body
    
    if (!contractId || !userAddress || !network) {
      return res.status(400).json({ error: 'Missing required parameters' })
    }

    console.log('📖 Calling smart contract:', {
      contractId,
      userAddress,
      network
    })

    // Call the smart contract using Stellar SDK with actual user address
    const contractArgs = [
      nativeToScVal(Address.fromString(userAddress), { type: 'address' }) // user
    ]
    
    const result = await callContract(contractId, 'get_user_messages', contractArgs)
    
    console.log('✅ Contract response:', result)
    
    // Parse the response - it should be an array of strings
    let messages: string[] = []
    try {
      if (result && Array.isArray(result)) {
        messages = result
      } else if (result) {
        // Handle case where result is not an array but contains messages
        messages = Array.isArray(result.messages) ? result.messages : []
      }
    } catch (parseError) {
      console.error('❌ Failed to parse contract response:', parseError)
      console.log('Raw response:', result)
      messages = []
    }
    
    return res.status(200).json({
      success: true,
      messages: messages,
      userAddress: userAddress,
      contractId: contractId
    })

  } catch (error: any) {
    console.error('❌ Error calling smart contract:', error)
    
    // Return empty messages instead of error to prevent UI from breaking
    return res.status(200).json({
      success: false,
      messages: [],
      error: error.message || 'Unknown error'
    })
  }
}