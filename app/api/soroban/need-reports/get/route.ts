import { NextRequest, NextResponse } from 'next/server'
import { execSync } from 'child_process'

const NEED_REPORTS_CONTRACT_ID = process.env.NEED_REPORTS_CONTRACT_ID || 'CD4RXDCGFTQGUO4Q3N2IU4RQXYGOL3236JK6KPBGCGSDSQ5ORY7A3KVF'
const CONTRACTS_DIR = '/Users/osx/Projects/Stellar/mvp02/Donaria/contracts-soroban/need-reports'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const reportId = searchParams.get('reportId')
    const userAddress = searchParams.get('userAddress')
    const status = searchParams.get('status')
    const offset = searchParams.get('offset') || '0'
    const limit = searchParams.get('limit') || '10'

    let command: string

    if (reportId) {
      // Get specific report
      command = `stellar contract invoke \\
        --id ${NEED_REPORTS_CONTRACT_ID} \\
        --source alice \\
        --network testnet \\
        -- get_report \\
        --report_id ${reportId}`
    } else if (userAddress) {
      // Get reports by user
      command = `stellar contract invoke \\
        --id ${NEED_REPORTS_CONTRACT_ID} \\
        --source alice \\
        --network testnet \\
        -- get_user_reports \\
        --user ${userAddress}`
    } else if (status) {
      // Get reports by status
      command = `stellar contract invoke \\
        --id ${NEED_REPORTS_CONTRACT_ID} \\
        --source alice \\
        --network testnet \\
        -- get_reports_by_status \\
        --status "${status}"`
    } else {
      // Get all reports with pagination
      command = `stellar contract invoke \\
        --id ${NEED_REPORTS_CONTRACT_ID} \\
        --source alice \\
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
      reports = JSON.parse(result.trim())
    } catch (parseError) {
      console.error('Failed to parse reports:', result)
      reports = []
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