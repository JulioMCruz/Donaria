import type { NextApiRequest, NextApiResponse } from 'next'
import { execSync } from 'child_process'
import { join } from 'path'

const NEED_REPORTS_CONTRACT_ID = process.env.NEED_REPORTS_CONTRACT_ID || 'CBJVRBD5TCCM3BF22NDZPBSMU7VON5LQZBQOW3HMTN3PFDWD2TLW34XW'
const CONTRACTS_DIR = '/Users/osx/Projects/Stellar/mvp02/Donaria/contracts-soroban/need-reports'

// Helper function to run stellar commands
function runStellarCommand(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    console.log('🔧 Running stellar command:', 'stellar', args.join(' '))
    
    try {
      const result = execSync(`stellar ${args.join(' ')}`, {
        cwd: CONTRACTS_DIR,
        encoding: 'utf8',
        timeout: 30000,
        stdio: ['pipe', 'pipe', 'pipe']
      })
      
      console.log('✅ Command completed successfully')
      resolve(result.trim())
    } catch (error: any) {
      console.error('❌ Command failed:', error)
      reject(error)
    }
  })
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
    
    // Call the smart contract to get user reports
    // Note: Read-only operations still require a source account for gas estimation
    const STELLAR_FUNDING_SECRET = process.env.STELLAR_FUNDING_SECRET
    if (!STELLAR_FUNDING_SECRET) {
      return res.status(500).json({ error: 'STELLAR_FUNDING_SECRET not configured' })
    }
    
    const result = await runStellarCommand([
      'contract', 'invoke',
      '--id', NEED_REPORTS_CONTRACT_ID,
      '--source', STELLAR_FUNDING_SECRET,
      '--network', 'testnet',
      '--',
      'get_user_reports',
      '--user', userAddress
    ])
    
    console.log('📋 Raw contract response:', result)
    
    // Parse the response
    let reports = []
    try {
      if (result && result !== '[]') {
        // The result should be a JSON array of reports
        const parsedResult = JSON.parse(result)
        reports = Array.isArray(parsedResult) ? parsedResult : [parsedResult]
        
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