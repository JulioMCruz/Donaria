import type { NextApiRequest, NextApiResponse } from 'next'
import { execSync, spawn } from 'child_process'
import { writeFileSync, unlinkSync, existsSync } from 'fs'
import { join } from 'path'

const NEED_REPORTS_CONTRACT_ID = process.env.NEED_REPORTS_CONTRACT_ID || 'CD4RXDCGFTQGUO4Q3N2IU4RQXYGOL3236JK6KPBGCGSDSQ5ORY7A3KVF'
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🚀 Need report API called')
    
    console.log('📝 Request body parsed:', {
      ...req.body,
      userPrivateKey: '[REDACTED]'
    })
    
    const {
      userPrivateKey,
      title,
      description,
      location,
      category,
      amountNeeded,
      imageUrls = []
    } = req.body

    if (!userPrivateKey || !title || !description || !location || !category || !amountNeeded) {
      console.log('❌ Missing required fields')
      return res.status(400).json({ error: 'Missing required fields' })
    }

    console.log('✅ All required fields present')

    if (!STELLAR_FUNDING_SECRET) {
      console.log('❌ STELLAR_FUNDING_SECRET not configured')
      return res.status(500).json({ error: 'Funding account not configured' })
    }

    console.log('✅ STELLAR_FUNDING_SECRET configured')

    // Check if contracts directory exists
    console.log('📁 Checking contracts directory:', CONTRACTS_DIR)
    if (!existsSync(CONTRACTS_DIR)) {
      console.error('❌ Contracts directory does not exist:', CONTRACTS_DIR)
      throw new Error(`Contracts directory not found: ${CONTRACTS_DIR}`)
    }
    console.log('✅ Contracts directory exists')

    // Generate unique timestamp for identity names
    const timestamp = Date.now()

    // Use Stellar SDK to get keypairs directly - no need for CLI identity management
    console.log('🔑 Processing user and funding keys...')
    const { Keypair } = await import('@stellar/stellar-sdk')
    const userKeypair = Keypair.fromSecret(userPrivateKey)
    const fundingKeypair = Keypair.fromSecret(STELLAR_FUNDING_SECRET!)
    
    // Get user's public key directly from the keypair
    console.log('🔍 Getting user public key...')
    const userAddress = userKeypair.publicKey()
    console.log('✅ User address retrieved:', userAddress.substring(0, 10) + '...')
    console.log('✅ Keys processed successfully')

    // Convert image URLs array to Stellar format
    console.log('🖼️ Processing image URLs...')
    const imageUrlsArg = imageUrls.length > 0 
      ? `[${imageUrls.map((url: string) => `"${url}"`).join(',')}]`
      : "[]"
    console.log('✅ Image URLs processed:', imageUrls.length, 'images')
    console.log('🔍 Image URLs argument:', imageUrlsArg)

    // Call create_report function - this requires user authorization due to creator.require_auth()
    // We need to build a transaction that both accounts can sign
    console.log('🚀 Creating need report...')
    console.log('⏳ This may take a few seconds...')
    console.log('📝 Note: Contract requires user authorization, building multi-sig transaction...')
    
    // First simulate the transaction to get the auth requirements
    console.log('🔍 Simulating transaction to understand auth requirements...')
    
    try {
      const simResult = await runStellarCommand([
        'contract', 'invoke',
        '--id', NEED_REPORTS_CONTRACT_ID,
        '--source', STELLAR_FUNDING_SECRET!,
        '--network', 'testnet',
        '--sim-only',
        '--',
        'create_report',
        '--creator', userAddress,
        '--title', title,
        '--description', description,
        '--location', location,
        '--category', category,
        '--amount_needed', amountNeeded.toString(),
        '--image_urls', imageUrlsArg
      ])
      console.log('✅ Simulation result:', simResult)
    } catch (simError) {
      console.log('⚠️ Simulation failed (expected for auth):', simError.message)
    }
    
    // App-sponsored transaction approach: Funding account pays fees, user provides authorization
    console.log('💡 Attempting app-sponsored transaction (funding account pays fees)')
    console.log('📝 Note: Contract requires user authorization due to creator.require_auth()')
    
    // Try app-sponsored approach first using temporary identity files
    const userIdentityName = `user_${timestamp}`
    const fundingIdentityName = `funding_${timestamp}`
    
    try {
      console.log('🔑 Creating temporary identity files for app-sponsored transaction...')
      
      const identityDir = join(CONTRACTS_DIR, '.stellar', 'identity')
      const { mkdir } = await import('fs/promises')
      await mkdir(identityDir, { recursive: true })
      
      // Create user identity file
      const userIdentityFile = join(identityDir, `${userIdentityName}.toml`)
      const userIdentityConfig = `secret_key = "${userPrivateKey}"\n`
      writeFileSync(userIdentityFile, userIdentityConfig, 'utf8')
      
      // Create funding identity file  
      const fundingIdentityFile = join(identityDir, `${fundingIdentityName}.toml`)
      const fundingIdentityConfig = `secret_key = "${STELLAR_FUNDING_SECRET}"\n`
      writeFileSync(fundingIdentityFile, fundingIdentityConfig, 'utf8')
      
      console.log('✅ Temporary identity files created')
      
      // Attempt app-sponsored transaction with funding account paying fees
      console.log('🏦 Attempting transaction with funding account as source...')
      try {
        const createResult = await runStellarCommand([
          'contract', 'invoke',
          '--id', NEED_REPORTS_CONTRACT_ID,
          '--source', fundingIdentityName, // Funding account pays fees
          '--network', 'testnet',
          '--',
          'create_report',
          '--creator', userAddress,
          '--title', title,
          '--description', description,
          '--location', location,
          '--category', category,
          '--amount_needed', amountNeeded.toString(),
          '--image_urls', imageUrlsArg
        ])
        
        console.log('✅ App-sponsored transaction successful:', createResult.trim())
        
        // Parse the result to get report ID and transaction hash
        let reportId: number
        let transactionHash: string | undefined
        
        try {
          // The result might be just the report ID, or it might include transaction info
          const lines = createResult.trim().split('\n')
          const lastLine = lines[lines.length - 1]
          
          // Try to parse the last line as report ID (number)
          reportId = parseInt(lastLine)
          
          // Look for transaction hash in the output
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
          
          console.log('📋 Parsed report ID:', reportId)
          console.log('🔗 Found transaction hash:', transactionHash || 'Not found')
        } catch (error) {
          console.error('Failed to parse report ID:', createResult)
          reportId = 0
        }
        
        // Cleanup temporary identity files
        try {
          unlinkSync(userIdentityFile)
          unlinkSync(fundingIdentityFile)
          console.log('🧹 Temporary identity files cleaned up')
        } catch (cleanupError) {
          console.warn('⚠️ Failed to cleanup temporary identity files:', cleanupError)
        }
        
        return res.status(200).json({
          success: true,
          reportId,
          message: 'Need report created successfully on blockchain (app-sponsored fees)',
          contractId: NEED_REPORTS_CONTRACT_ID,
          userAddress,
          imageUrls,
          transactionHash
        })
        
      } catch (sponsoredError: any) {
        console.log('⚠️ App-sponsored transaction failed, falling back to user-paid...')
        console.log('📝 Reason:', sponsoredError.message)
        
        // Cleanup temporary files
        try {
          unlinkSync(userIdentityFile)
          unlinkSync(fundingIdentityFile)
        } catch (cleanupError) {
          console.warn('⚠️ Failed to cleanup temporary identity files:', cleanupError)
        }
        
        // Fall back to user-paid approach
        console.log('🔄 Fallback: User pays transaction fees (user has sufficient balance)')
        const createResult = await runStellarCommand([
          'contract', 'invoke',
          '--id', NEED_REPORTS_CONTRACT_ID,
          '--source', userPrivateKey, // User pays fees as fallback
          '--network', 'testnet',
          '--',
          'create_report',
          '--creator', userAddress,
          '--title', title,
          '--description', description,
          '--location', location,
          '--category', category,
          '--amount_needed', amountNeeded.toString(),
          '--image_urls', imageUrlsArg
        ])
        
        console.log('✅ Report created via user-paid fallback:', createResult.trim())
        
        // Parse the result to get report ID and transaction hash
        let reportId: number
        let transactionHash: string | undefined
        
        try {
          // The result might be just the report ID, or it might include transaction info
          const lines = createResult.trim().split('\n')
          const lastLine = lines[lines.length - 1]
          
          // Try to parse the last line as report ID (number)
          reportId = parseInt(lastLine)
          
          // Look for transaction hash in the output
          for (const line of lines) {
            if (line.includes('transaction:') || line.includes('tx:') || line.includes('hash:') || line.includes('hash:') || line.includes('Transaction hash:')) {
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
          
          console.log('📋 Parsed report ID:', reportId)
          console.log('🔗 Found transaction hash:', transactionHash || 'Not found')
        } catch (error) {
          console.error('Failed to parse report ID:', createResult)
          reportId = 0
        }
        
        return res.status(200).json({
          success: true,
          reportId,
          message: 'Need report created successfully on blockchain (user-paid fees)',
          contractId: NEED_REPORTS_CONTRACT_ID,
          userAddress,
          imageUrls,
          transactionHash
        })
      }
      
    } catch (identityError: any) {
      console.error('❌ Identity file creation failed:', identityError)
      throw identityError
    }

  } catch (error: any) {
    console.error('❌ Error creating need report:', error)
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create need report',
      details: error.toString()
    })
  }
}