import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    console.log('📖 Soroban API: Getting user messages from smart contract')
    
    const { contractId, userAddress, network } = await request.json()
    
    if (!contractId || !userAddress || !network) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    console.log('📖 Calling smart contract:', {
      contractId,
      userAddress,
      network
    })

    // Query messages for the actual user address (not Alice demo account)
    // This will return messages stored specifically for this user's address
    
    // Call the smart contract using Stellar CLI with actual user address
    const command = `stellar contract invoke --id ${contractId} --source alice --network ${network} -- get_user_messages --user ${userAddress}`
    
    console.log('📖 Executing command:', command)
    
    const { stdout, stderr } = await execAsync(command, { 
      timeout: 30000,
      cwd: '/Users/osx/Projects/Stellar/mvp02/contracts-soroban/message-storage'
    })
    
    if (stderr) {
      console.error('❌ Contract call stderr:', stderr)
    }
    
    console.log('✅ Contract response:', stdout)
    
    // Parse the response - it should be a JSON array of strings
    let messages: string[] = []
    try {
      // The stellar CLI returns the result, we need to parse it
      const result = stdout.trim()
      if (result) {
        messages = JSON.parse(result)
      }
    } catch (parseError) {
      console.error('❌ Failed to parse contract response:', parseError)
      console.log('Raw response:', stdout)
      messages = []
    }
    
    return NextResponse.json({
      success: true,
      messages: messages,
      userAddress: userAddress,
      contractId: contractId
    })

  } catch (error) {
    console.error('❌ Error calling smart contract:', error)
    
    // Return empty messages instead of error to prevent UI from breaking
    return NextResponse.json({
      success: false,
      messages: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}