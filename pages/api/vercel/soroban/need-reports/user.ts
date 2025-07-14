import type { NextApiRequest, NextApiResponse } from 'next'
import { 
  Contract, 
  SorobanRpc, 
  Keypair, 
  Networks, 
  TransactionBuilder,
  Operation,
  Address,
  nativeToScVal,
  scValToNative
} from '@stellar/stellar-sdk'

const NEED_REPORTS_CONTRACT_ID = process.env.NEED_REPORTS_CONTRACT_ID || 'CBJVRBD5TCCM3BF22NDZPBSMU7VON5LQZBQOW3HMTN3PFDWD2TLW34XW'

// Initialize Soroban RPC server
const server = new SorobanRpc.Server('https://soroban-testnet.stellar.org')

// Helper function to call contract methods
async function callContract(contractId: string, method: string, args: any[] = [], sourceSecret?: string) {
  try {
    console.log(`🔧 Calling contract method: ${method}`)
    
    const contract = new Contract(contractId)
    
    // For read-only operations, we can use simulation
    if (!sourceSecret && (method.startsWith('get_') || method.startsWith('query_'))) {
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
    }
    
    // For write operations, we need a real source account
    if (sourceSecret) {
      console.log('✍️ Executing transaction with source account')
      
      const sourceKeypair = Keypair.fromSecret(sourceSecret)
      const sourceAccount = await server.getAccount(sourceKeypair.publicKey())
      
      const operation = contract.call(method, ...args)
      
      const txBuilder = new TransactionBuilder(sourceAccount, {
        fee: '100',
        networkPassphrase: Networks.TESTNET,
      }).addOperation(operation).setTimeout(30)
      
      const tx = txBuilder.build()
      tx.sign(sourceKeypair)
      
      const result = await server.sendTransaction(tx)
      
      if (result.status === 'ERROR') {
        throw new Error(`Transaction failed: ${result.errorResult}`)
      }
      
      // Wait for confirmation
      if (result.status === 'PENDING') {
        const hash = result.hash
        let attempts = 0
        while (attempts < 10) {
          await new Promise(resolve => setTimeout(resolve, 1000))
          const txResult = await server.getTransaction(hash)
          if (txResult.status === 'SUCCESS') {
            if (txResult.returnValue) {
              return scValToNative(txResult.returnValue)
            }
            return null
          } else if (txResult.status === 'FAILED') {
            throw new Error(`Transaction failed: ${txResult.resultXdr}`)
          }
          attempts++
        }
        throw new Error('Transaction timeout')
      }
      
      if (result.returnValue) {
        return scValToNative(result.returnValue)
      }
      
      return null
    }
    
    throw new Error('No source secret provided for contract call')
    
  } catch (error: any) {
    console.error('❌ Contract call failed:', error)
    throw error
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🔍 Fetching user reports from smart contract')
    
    const { userAddress } = req.query
    
    if (!userAddress || typeof userAddress !== 'string') {
      return res.status(400).json({ error: 'userAddress parameter is required' })
    }
    
    console.log('👤 Fetching reports for user:', userAddress.substring(0, 10) + '...')
    
    // Call the smart contract to get user reports using Stellar SDK
    const userAddressParam = Address.fromString(userAddress)
    const result = await callContract(
      NEED_REPORTS_CONTRACT_ID, 
      'get_user_reports', 
      [nativeToScVal(userAddressParam, { type: 'address' })]
    )
    
    console.log('📋 Raw contract response:', result)
    
    // Parse the response
    let reports = []
    try {
      if (result) {
        // The result is already parsed by scValToNative
        reports = Array.isArray(result) ? result : [result]
        
        // Transform the reports to match the frontend interface
        reports = reports.map((report: any) => ({
          id: report.id?.toString() || '0',
          title: report.title || 'Untitled Report',
          description: report.description || '',
          location: report.location || '',
          category: report.category || '',
          amountNeeded: parseInt(report.amount_needed) || 0,
          amountRaised: parseInt(report.amount_raised) || 0,
          status: mapContractStatus(report.status || 'pending'),
          imageUrl: report.image_urls && report.image_urls.length > 0 ? report.image_urls[0] : '/placeholder.svg',
          imageUrls: report.image_urls || [],
          creator: report.creator || userAddress,
          createdAt: report.created_at || Date.now(),
          updatedAt: report.updated_at || Date.now(),
          verificationNotes: report.verification_notes || ''
        }))
      }
    } catch (parseError) {
      console.error('❌ Failed to parse contract response:', parseError)
      console.log('Raw response was:', result)
      // Return empty array if parsing fails
      reports = []
    }
    
    console.log(`✅ Found ${reports.length} reports for user`)
    
    return res.status(200).json({
      success: true,
      reports,
      userAddress,
      totalCount: reports.length
    })
    
  } catch (error: any) {
    console.error('❌ Error fetching user reports:', error)
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch user reports',
      details: error.toString()
    })
  }
}

// Helper function to map contract status to frontend status
function mapContractStatus(contractStatus: string): "Pending" | "Verified" | "Funded" {
  switch (contractStatus.toLowerCase()) {
    case 'pending':
      return 'Pending'
    case 'verified':
      return 'Verified'
    case 'funded':
    case 'completed':
      return 'Funded'
    default:
      return 'Pending'
  }
}