import type { NextApiRequest, NextApiResponse } from 'next'
import { 
  Contract, 
  Keypair, 
  Networks, 
  TransactionBuilder,
  Account,
  Address,
  nativeToScVal,
  scValToNative
} from '@stellar/stellar-sdk'

const NEED_REPORTS_CONTRACT_ID = process.env.NEED_REPORTS_CONTRACT_ID || 'CBJVRBD5TCCM3BF22NDZPBSMU7VON5LQZBQOW3HMTN3PFDWD2TLW34XW'

// Initialize Soroban RPC server
let server: any

try {
  const StellarSdk = require('@stellar/stellar-sdk')
  
  if (StellarSdk.rpc && StellarSdk.rpc.Server) {
    server = new StellarSdk.rpc.Server('https://soroban-testnet.stellar.org')
    console.log('✅ Get route: Soroban RPC server initialized successfully')
  } else {
    console.error('❌ Get route: StellarSdk.rpc.Server not found in SDK')
    throw new Error('Stellar SDK rpc.Server not available')
  }
} catch (error) {
  console.error('❌ Get route: Failed to initialize Soroban server:', error)
}

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
    
    // Create a proper account object for simulation
    const account = new Account(dummyKeypair.publicKey(), '0')
    
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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🔍 Fetching need reports from smart contract')
    
    const { reportId, userAddress, status, offset = '0', limit = '10' } = req.query
    
    let result
    let contractMethod
    let contractArgs: any[] = []

    if (reportId && typeof reportId === 'string') {
      // Get specific report
      console.log('📋 Fetching specific report:', reportId)
      contractMethod = 'get_report'
      contractArgs = [nativeToScVal(parseInt(reportId), { type: 'u64' })]
      
    } else if (userAddress && typeof userAddress === 'string') {
      // Get reports by user
      console.log('👤 Fetching reports for user:', userAddress.substring(0, 10) + '...')
      contractMethod = 'get_user_reports'
      // Convert string to Address using official Stellar SDK method with error handling
      try {
        const address = new Address(userAddress)
        contractArgs = [address.toScVal()]
      } catch (addressError) {
        console.log('⚠️ Invalid address format, skipping user address filter')
        // Fall back to getting all reports if address is invalid
        console.log('📑 Fetching all reports due to invalid address')
        contractMethod = 'get_all_reports'
        contractArgs = [
          nativeToScVal(parseInt(offset as string), { type: 'u32' }),
          nativeToScVal(parseInt(limit as string), { type: 'u32' })
        ]
      }
      
    } else if (status && typeof status === 'string') {
      // Get reports by status
      console.log('📊 Fetching reports by status:', status)
      contractMethod = 'get_reports_by_status'
      contractArgs = [nativeToScVal(status, { type: 'string' })]
      
    } else {
      // Get all reports with pagination
      console.log('📑 Fetching all reports with pagination:', { offset, limit })
      contractMethod = 'get_all_reports'
      contractArgs = [
        nativeToScVal(parseInt(offset as string), { type: 'u32' }),
        nativeToScVal(parseInt(limit as string), { type: 'u32' })
      ]
    }

    // Call the smart contract using Stellar SDK
    result = await callContract(NEED_REPORTS_CONTRACT_ID, contractMethod, contractArgs)
    
    console.log('📋 Raw contract response:', result)
    
    // Parse and transform the response
    let reports
    try {
      if (reportId) {
        // Single report case
        reports = result ? {
          id: typeof result.id === 'bigint' ? Number(result.id) : (parseInt(result.id) || 0),
          title: result.title || 'Untitled Report',
          description: result.description || '',
          location: result.location || '',
          category: result.category || '',
          amountNeeded: typeof result.amount_needed === 'bigint' ? Number(result.amount_needed) : (parseInt(result.amount_needed) || 0),
          amountRaised: typeof result.amount_raised === 'bigint' ? Number(result.amount_raised) : (parseInt(result.amount_raised) || 0),
          status: mapContractStatus(result.status || 'pending'),
          imageUrl: result.image_urls && result.image_urls.length > 0 ? result.image_urls[0] : '/placeholder.svg',
          imageUrls: result.image_urls || [],
          creator: result.creator || '',
          createdAt: typeof result.created_at === 'bigint' ? Number(result.created_at) : (parseInt(result.created_at) || Date.now()),
          updatedAt: typeof result.updated_at === 'bigint' ? Number(result.updated_at) : (parseInt(result.updated_at) || Date.now()),
          verificationNotes: result.verification_notes || ''
        } : null
      } else {
        // Multiple reports case
        reports = Array.isArray(result) ? result.map((report: any) => ({
          id: typeof report.id === 'bigint' ? Number(report.id) : (parseInt(report.id) || 0),
          title: report.title || 'Untitled Report',
          description: report.description || '',
          location: report.location || '',
          category: report.category || '',
          amountNeeded: typeof report.amount_needed === 'bigint' ? Number(report.amount_needed) : (parseInt(report.amount_needed) || 0),
          amountRaised: typeof report.amount_raised === 'bigint' ? Number(report.amount_raised) : (parseInt(report.amount_raised) || 0),
          status: mapContractStatus(report.status || 'pending'),
          imageUrl: report.image_urls && report.image_urls.length > 0 ? report.image_urls[0] : '/placeholder.svg',
          imageUrls: report.image_urls || [],
          creator: report.creator || '',
          createdAt: typeof report.created_at === 'bigint' ? Number(report.created_at) : (parseInt(report.created_at) || Date.now()),
          updatedAt: typeof report.updated_at === 'bigint' ? Number(report.updated_at) : (parseInt(report.updated_at) || Date.now()),
          verificationNotes: report.verification_notes || ''
        })) : []
      }
    } catch (parseError) {
      console.error('❌ Failed to parse contract response:', parseError)
      console.log('Raw response was:', result)
      reports = reportId ? null : []
    }

    console.log(`✅ ${reportId ? 'Report' : 'Reports'} fetched successfully`)

    return res.status(200).json({
      success: true,
      reports,
      contractId: NEED_REPORTS_CONTRACT_ID,
      query: {
        reportId,
        userAddress,
        status,
        offset,
        limit
      }
    })

  } catch (error: any) {
    console.error('❌ Error fetching need reports:', error)
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch need reports',
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