import { NextRequest, NextResponse } from 'next/server'
import { execSync } from 'child_process'

const NEED_REPORTS_CONTRACT_ID = process.env.NEED_REPORTS_CONTRACT_ID || 'CBJVRBD5TCCM3BF22NDZPBSMU7VON5LQZBQOW3HMTN3PFDWD2TLW34XW'
const STELLAR_FUNDING_SECRET = process.env.STELLAR_FUNDING_SECRET
const CONTRACTS_DIR = '/Users/osx/Projects/Stellar/mvp02/Donaria/contracts-soroban/need-reports'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reportId = searchParams.get('reportId')
    const userAddress = searchParams.get('userAddress')
    const status = searchParams.get('status')
    const offset = searchParams.get('offset') || '0'
    const limit = searchParams.get('limit') || '10'

    if (!STELLAR_FUNDING_SECRET) {
      return NextResponse.json(
        { error: 'STELLAR_FUNDING_SECRET not configured' },
        { status: 500 }
      )
    }

    let command: string

    if (reportId) {
      // Get specific report
      command = `stellar contract invoke \\
        --id ${NEED_REPORTS_CONTRACT_ID} \\
        --source ${STELLAR_FUNDING_SECRET} \\
        --network testnet \\
        -- get_report \\
        --report_id ${reportId}`
    } else if (userAddress) {
      // Get reports by user
      command = `stellar contract invoke \\
        --id ${NEED_REPORTS_CONTRACT_ID} \\
        --source ${STELLAR_FUNDING_SECRET} \\
        --network testnet \\
        -- get_user_reports \\
        --user ${userAddress}`
    } else if (status) {
      // Get reports by status
      command = `stellar contract invoke \\
        --id ${NEED_REPORTS_CONTRACT_ID} \\
        --source ${STELLAR_FUNDING_SECRET} \\
        --network testnet \\
        -- get_reports_by_status \\
        --status "${status}"`
    } else {
      // Get all reports with pagination
      command = `stellar contract invoke \\
        --id ${NEED_REPORTS_CONTRACT_ID} \\
        --source ${STELLAR_FUNDING_SECRET} \\
        --network testnet \\
        -- get_all_reports \\
        --offset ${offset} \\
        --limit ${limit}`
    }

    console.log('🔍 Fetching need reports...')
    const result = execSync(command, {
      cwd: CONTRACTS_DIR,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    })

    console.log('✅ Reports fetched successfully')

    // Parse the result
    let reports
    try {
      const parsedResult = JSON.parse(result.trim())
      
      // Transform the data to match frontend interface
      if (reportId) {
        // Single report case
        reports = parsedResult ? {
          id: parsedResult.id?.toString() || '0',
          title: parsedResult.title || 'Untitled Report',
          description: parsedResult.description || '',
          location: parsedResult.location || '',
          category: parsedResult.category || '',
          amountNeeded: parseInt(parsedResult.amount_needed) || 0,
          amountRaised: parseInt(parsedResult.amount_raised) || 0,
          status: mapContractStatus(parsedResult.status || 'pending'),
          imageUrl: parsedResult.image_urls && parsedResult.image_urls.length > 0 ? parsedResult.image_urls[0] : '/placeholder.svg',
          imageUrls: parsedResult.image_urls || [],
          creator: parsedResult.creator || '',
          createdAt: parsedResult.created_at || Date.now(),
          updatedAt: parsedResult.updated_at || Date.now(),
          verificationNotes: parsedResult.verification_notes || ''
        } : null
      } else {
        // Multiple reports case
        reports = Array.isArray(parsedResult) ? parsedResult.map((report: any) => ({
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
          creator: report.creator || '',
          createdAt: report.created_at || Date.now(),
          updatedAt: report.updated_at || Date.now(),
          verificationNotes: report.verification_notes || ''
        })) : []
      }
    } catch (parseError) {
      console.error('Failed to parse reports:', result)
      reports = reportId ? null : []
    }

    return NextResponse.json({
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
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch need reports',
      details: error.toString()
    }, { status: 500 })
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