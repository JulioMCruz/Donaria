import { NextRequest, NextResponse } from 'next/server'
import { execSync } from 'child_process'
import { writeFileSync, unlinkSync, existsSync } from 'fs'
import { join } from 'path'

const NEED_REPORTS_CONTRACT_ID = process.env.NEED_REPORTS_CONTRACT_ID || 'CD4RXDCGFTQGUO4Q3N2IU4RQXYGOL3236JK6KPBGCGSDSQ5ORY7A3KVF'
const STELLAR_FUNDING_SECRET = process.env.STELLAR_FUNDING_SECRET
const CONTRACTS_DIR = '/Users/osx/Projects/Stellar/mvp02/Donaria/contracts-soroban/need-reports'

export async function POST(request: NextRequest) {
  let userIdentityFile: string | null = null
  let fundingIdentityFile: string | null = null

  try {
    const body = await request.json()
    const {
      userPrivateKey,
      title,
      description,
      location,
      category,
      amountNeeded,
      imageUrls = []
    } = body

    if (!userPrivateKey || !title || !description || !location || !category || !amountNeeded) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!STELLAR_FUNDING_SECRET) {
      return NextResponse.json(
        { error: 'Funding account not configured' },
        { status: 500 }
      )
    }

    // Create temporary identity files
    const timestamp = Date.now()
    userIdentityFile = join(CONTRACTS_DIR, `user_identity_${timestamp}.txt`)
    fundingIdentityFile = join(CONTRACTS_DIR, `funding_identity_${timestamp}.txt`)

    writeFileSync(userIdentityFile, userPrivateKey)
    writeFileSync(fundingIdentityFile, STELLAR_FUNDING_SECRET)

    // Import identities
    execSync(`stellar keys add user_${timestamp} --secret-key`, {
      input: userPrivateKey,
      cwd: CONTRACTS_DIR,
      stdio: ['pipe', 'pipe', 'pipe']
    })

    execSync(`stellar keys add funding_${timestamp} --secret-key`, {
      input: STELLAR_FUNDING_SECRET,
      cwd: CONTRACTS_DIR,
      stdio: ['pipe', 'pipe', 'pipe']
    })

    // Get user's public key
    const userPublicKeyResult = execSync(
      `stellar keys address user_${timestamp}`,
      {
        cwd: CONTRACTS_DIR,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      }
    )
    const userAddress = userPublicKeyResult.trim()

    // Convert image URLs array to Stellar format
    const imageUrlsArg = imageUrls.length > 0 
      ? `'[${imageUrls.map((url: string) => `"${url}"`).join(',')}]'`
      : "'[]'"

    // Call create_report function (app-sponsored)
    const createReportCommand = `stellar contract invoke \\
      --id ${NEED_REPORTS_CONTRACT_ID} \\
      --source funding_${timestamp} \\
      --network testnet \\
      -- create_report \\
      --creator ${userAddress} \\
      --title "${title}" \\
      --description "${description}" \\
      --location "${location}" \\
      --category "${category}" \\
      --amount_needed ${amountNeeded} \\
      --image_urls ${imageUrlsArg}`

    console.log('🚀 Creating need report...')
    const createResult = execSync(createReportCommand, {
      cwd: CONTRACTS_DIR,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    })

    console.log('✅ Report created successfully:', createResult.trim())

    // Parse the result to get report ID
    let reportId: number
    try {
      reportId = parseInt(createResult.trim())
    } catch (error) {
      console.error('Failed to parse report ID:', createResult)
      reportId = 0
    }

    // Cleanup identities
    try {
      execSync(`stellar keys remove user_${timestamp}`, {
        cwd: CONTRACTS_DIR,
        stdio: ['pipe', 'pipe', 'pipe']
      })
      execSync(`stellar keys remove funding_${timestamp}`, {
        cwd: CONTRACTS_DIR,
        stdio: ['pipe', 'pipe', 'pipe']
      })
    } catch (cleanupError) {
      console.warn('Cleanup warning:', cleanupError)
    }

    return NextResponse.json({
      success: true,
      reportId,
      message: 'Need report created successfully on blockchain',
      contractId: NEED_REPORTS_CONTRACT_ID,
      userAddress,
      imageUrls
    })

  } catch (error: any) {
    console.error('❌ Error creating need report:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create need report',
      details: error.toString()
    }, { status: 500 })

  } finally {
    // Cleanup temporary files
    try {
      if (userIdentityFile && existsSync(userIdentityFile)) {
        unlinkSync(userIdentityFile)
      }
      if (fundingIdentityFile && existsSync(fundingIdentityFile)) {
        unlinkSync(fundingIdentityFile)
      }
    } catch (cleanupError) {
      console.warn('File cleanup warning:', cleanupError)
    }
  }
}