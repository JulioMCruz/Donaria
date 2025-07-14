import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'

const NEED_REPORTS_CONTRACT_ID = process.env.NEED_REPORTS_CONTRACT_ID || 'CBJVRBD5TCCM3BF22NDZPBSMU7VON5LQZBQOW3HMTN3PFDWD2TLW34XW'
const STELLAR_FUNDING_SECRET = process.env.STELLAR_FUNDING_SECRET
const CONTRACTS_DIR = '/Users/osx/Projects/Stellar/mvp02/Donaria/contracts-soroban/need-reports'

// Helper function to run stellar commands with stdin input
function runStellarCommand(args: string[], input?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    console.log('🔧 Running stellar command:', 'stellar', args.join(' '))
    const child = spawn('stellar', args, {
      cwd: CONTRACTS_DIR,
      stdio: ['pipe', 'pipe', 'pipe']
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    child.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    if (input) {
      child.stdin.write(input + '\n')
      child.stdin.end()
    }

    const timeout = setTimeout(() => {
      child.kill()
      reject(new Error('Command timed out after 30 seconds'))
    }, 30000)

    child.on('close', (code) => {
      clearTimeout(timeout)
      if (code === 0) {
        console.log('✅ Command completed successfully')
        resolve(stdout.trim())
      } else {
        console.error('❌ Command failed with code:', code)
        console.error('❌ stdout:', stdout)
        console.error('❌ stderr:', stderr)
        reject(new Error(`Command failed with exit code ${code}: ${stderr || stdout}`))
      }
    })

    child.on('error', (error) => {
      clearTimeout(timeout)
      console.error('❌ Spawn error:', error)
      reject(error)
    })
  })
}

export async function PUT(request: NextRequest) {
  try {
    console.log('🔄 Need update API called')
    
    const body = await request.json()
    console.log('📝 Request body parsed:', {
      ...body,
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
    } = body

    if (!userPrivateKey || !reportId || !reason) {
      console.log('❌ Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields: userPrivateKey, reportId, and reason are required' },
        { status: 400 }
      )
    }

    console.log('✅ All required fields present')

    if (!STELLAR_FUNDING_SECRET) {
      console.log('❌ STELLAR_FUNDING_SECRET not configured')
      return NextResponse.json(
        { error: 'Funding account not configured' },
        { status: 500 }
      )
    }

    console.log('✅ STELLAR_FUNDING_SECRET configured')

    // Generate unique timestamp for identity names
    const timestamp = Date.now()

    // Use Stellar SDK to get keypairs directly
    console.log('🔑 Processing user key...')
    const { Keypair } = await import('@stellar/stellar-sdk')
    const userKeypair = Keypair.fromSecret(userPrivateKey)
    
    // Get user's public key directly from the keypair
    console.log('🔍 Getting user public key...')
    const userAddress = userKeypair.publicKey()
    console.log('✅ User address retrieved:', userAddress.substring(0, 10) + '...')

    // Convert image URLs array to Stellar format
    console.log('🖼️ Processing image URLs...')
    const imageUrlsArg = imageUrls.length > 0 
      ? `[${imageUrls.map((url: string) => `"${url}"`).join(',')}]`
      : "[]"
    console.log('✅ Image URLs processed:', imageUrls.length, 'images')

    // Create temporary identity file for the user
    const userIdentityName = `user_${timestamp}`
    
    try {
      console.log('🔑 Creating temporary identity file...')
      
      const identityDir = join(CONTRACTS_DIR, '.stellar', 'identity')
      const { mkdir } = await import('fs/promises')
      await mkdir(identityDir, { recursive: true })
      
      // Create user identity file
      const userIdentityFile = join(identityDir, `${userIdentityName}.toml`)
      const userIdentityConfig = `secret_key = "${userPrivateKey}"\n`
      writeFileSync(userIdentityFile, userIdentityConfig, 'utf8')
      
      console.log('✅ Temporary identity file created')
      
      // Call update_report function
      console.log('🔄 Updating need report...')
      console.log('⏳ This may take a few seconds...')
      
      // Build the command arguments
      const commandArgs = [
        'contract', 'invoke',
        '--id', NEED_REPORTS_CONTRACT_ID,
        '--source', userIdentityName, // User must authorize the update
        '--network', 'testnet',
        '--',
        'update_report',
        '--report_id', reportId.toString(),
        '--updater', userAddress,
        '--reason', reason
      ]

      // Add optional fields only if they are provided
      if (title !== undefined) {
        commandArgs.push('--title', title)
      }
      if (description !== undefined) {
        commandArgs.push('--description', description)
      }
      if (location !== undefined) {
        commandArgs.push('--location', location)
      }
      if (category !== undefined) {
        commandArgs.push('--category', category)
      }
      if (amountNeeded !== undefined) {
        commandArgs.push('--amount_needed', amountNeeded.toString())
      }
      if (imageUrls.length > 0) {
        commandArgs.push('--image_urls', imageUrlsArg)
      }
      
      const updateResult = await runStellarCommand(commandArgs)
      
      console.log('✅ Report updated successfully:', updateResult.trim())
      
      // Parse the result
      let success = false
      let transactionHash: string | undefined
      
      try {
        // The result should be "true" for successful update
        success = updateResult.trim() === 'true'
        
        // Look for transaction hash in the output
        const lines = updateResult.trim().split('\n')
        for (const line of lines) {
          if (line.includes('transaction:') || line.includes('tx:') || line.includes('hash:') || line.includes('Transaction hash:')) {
            const hashMatch = line.match(/[0-9a-f]{64}/i)
            if (hashMatch) {
              transactionHash = hashMatch[0]
              break
            }
          }
        }
        
        // If no hash found in specific lines, scan all lines for any 64-char hex string
        if (!transactionHash) {
          for (const line of lines) {
            const hashMatch = line.match(/[0-9a-f]{64}/i)
            if (hashMatch) {
              transactionHash = hashMatch[0]
              break
            }
          }
        }
        
        console.log('📋 Update result:', success)
        console.log('🔗 Found transaction hash:', transactionHash || 'Not found')
      } catch (error) {
        console.error('Failed to parse update result:', updateResult)
        success = false
      }
      
      // Cleanup temporary identity file
      try {
        unlinkSync(userIdentityFile)
        console.log('🧹 Temporary identity file cleaned up')
      } catch (cleanupError) {
        console.warn('⚠️ Failed to cleanup temporary identity file:', cleanupError)
      }
      
      if (success) {
        return NextResponse.json({
          success: true,
          reportId,
          message: 'Need report updated successfully on blockchain',
          contractId: NEED_REPORTS_CONTRACT_ID,
          userAddress,
          transactionHash
        })
      } else {
        return NextResponse.json({
          success: false,
          error: 'Update operation returned false - check if you have permission to update this report'
        }, { status: 400 })
      }
      
    } catch (identityError: any) {
      console.error('❌ Identity file creation failed:', identityError)
      return NextResponse.json({
        success: false,
        error: identityError.message || 'Failed to create temporary identity file'
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('❌ Error updating need report:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update need report',
      details: error.toString()
    }, { status: 500 })
  }
}