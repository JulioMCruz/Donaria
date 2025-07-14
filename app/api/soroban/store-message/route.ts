import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    console.log('📝 Soroban API: Storing message in smart contract')
    
    const { contractId, userAddress, message, network } = await request.json()
    
    if (!contractId || !userAddress || !message || !network) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    console.log('📝 Storing message in contract:', {
      contractId,
      userAddress,
      message,
      network
    })

    // For this demo, we'll use Alice as both the source and user account
    // In a real implementation, we would need the user's private key to sign their own transactions
    // This is a limitation of the current setup where we don't have user private keys server-side
    const sourceAccount = 'alice'
    const demoUserAccount = 'alice' // Use alice's address for demo

    // Call the smart contract using Stellar CLI
    const command = `stellar contract invoke --id ${contractId} --source ${sourceAccount} --network ${network} -- store_message --user ${demoUserAccount} --message "${message} (from ${userAddress.slice(0,8)}...)"`
    
    console.log('📝 Executing command:', command)
    
    const { stdout, stderr } = await execAsync(command, { 
      timeout: 60000,
      cwd: process.cwd()
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
        // Look for the number in the output
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

  } catch (error) {
    console.error('❌ Error storing message in smart contract:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}