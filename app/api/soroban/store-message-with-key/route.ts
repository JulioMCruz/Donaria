import { NextRequest, NextResponse } from 'next/server'
import { exec, spawn } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import os from 'os'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Soroban API: Storing message with app-sponsored gas')
    
    const { contractId, userAddress, message, network, privateKey } = await request.json()
    
    if (!contractId || !userAddress || !message || !network || !privateKey) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    console.log('🔐 Storing message with app-sponsored gas:', {
      contractId,
      userAddress,
      message,
      network
    })

    // Get funding account private key from environment
    const fundingPrivateKey = process.env.STELLAR_FUNDING_SECRET
    if (!fundingPrivateKey) {
      throw new Error('STELLAR_FUNDING_SECRET not configured')
    }

    // Create temporary identities for both user and funding account
    const userIdentityName = `user_${Date.now()}`
    const fundingIdentityName = `funding_${Date.now()}`
    
    try {
      console.log('🔑 Creating temporary identity files...')
      
      const identityDir = path.join('/Users/osx/Projects/Stellar/mvp02/contracts-soroban/message-storage', '.stellar', 'identity')
      await fs.promises.mkdir(identityDir, { recursive: true })
      
      // Create user identity file
      const userIdentityFile = path.join(identityDir, `${userIdentityName}.toml`)
      const userIdentityConfig = `secret_key = "${privateKey}"\n`
      await fs.promises.writeFile(userIdentityFile, userIdentityConfig, 'utf8')
      
      // Create funding identity file  
      const fundingIdentityFile = path.join(identityDir, `${fundingIdentityName}.toml`)
      const fundingIdentityConfig = `secret_key = "${fundingPrivateKey}"\n`
      await fs.promises.writeFile(fundingIdentityFile, fundingIdentityConfig, 'utf8')
      
      console.log('✅ Temporary identity files created')
      
      // Use funding account to pay for transaction with sponsored message function
      // This way the app pays gas but user identity is preserved in the message
      const command = `stellar contract invoke --id ${contractId} --source ${fundingIdentityName} --network ${network} -- store_sponsored_message --user ${userAddress} --message "${message}"`
      
      console.log('📝 Executing contract with user key...')
      
      const { stdout, stderr } = await execAsync(command, { 
        timeout: 60000,
        cwd: '/Users/osx/Projects/Stellar/mvp02/contracts-soroban/message-storage'
      })
      
      if (stderr) {
        console.error('❌ Contract call stderr:', stderr)
      }
      
      console.log('✅ Contract response:', stdout)
      
      // Parse the response - it should be a number (message count)
      let messageCount = 0
      try {
        const result = stdout.trim()
        if (result) {
          const matches = result.match(/\d+/)
          if (matches) {
            messageCount = parseInt(matches[0], 10) || 0
          }
        }
      } catch (parseError) {
        console.error('❌ Failed to parse contract response:', parseError)
        console.log('Raw response:', stdout)
      }
      
      return NextResponse.json({
        success: true,
        messageCount: messageCount,
        userAddress: userAddress,
        message: message,
        contractId: contractId
      })

    } finally {
      // Clean up: remove both temporary identity files
      try {
        const userIdentityFile = path.join('/Users/osx/Projects/Stellar/mvp02/contracts-soroban/message-storage', '.stellar', 'identity', `${userIdentityName}.toml`)
        const fundingIdentityFile = path.join('/Users/osx/Projects/Stellar/mvp02/contracts-soroban/message-storage', '.stellar', 'identity', `${fundingIdentityName}.toml`)
        
        await Promise.all([
          fs.promises.unlink(userIdentityFile).catch(() => {}),
          fs.promises.unlink(fundingIdentityFile).catch(() => {})
        ])
        
        console.log('🧹 Temporary identity files cleaned up')
      } catch (cleanupError) {
        console.warn('⚠️ Failed to cleanup temporary identity files:', cleanupError)
      }
    }

  } catch (error) {
    console.error('❌ Error storing message with user key:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}