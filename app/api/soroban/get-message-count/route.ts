import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    console.log('🔢 Soroban API: Getting total message count from smart contract')
    
    const { contractId, network } = await request.json()
    
    if (!contractId || !network) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    console.log('🔢 Calling smart contract:', {
      contractId,
      network
    })

    // Call the smart contract using Stellar CLI
    const command = `stellar contract invoke --id ${contractId} --source alice --network ${network} -- get_message_count`
    
    console.log('🔢 Executing command:', command)
    
    const { stdout, stderr } = await execAsync(command, { 
      timeout: 30000,
      cwd: '/Users/osx/Projects/Stellar/mvp02/contracts-soroban/message-storage'
    })
    
    if (stderr) {
      console.error('❌ Contract call stderr:', stderr)
    }
    
    console.log('✅ Contract response:', stdout)
    
    // Parse the response - it should be a number
    let count = 0
    try {
      const result = stdout.trim()
      if (result) {
        count = parseInt(result, 10) || 0
      }
    } catch (parseError) {
      console.error('❌ Failed to parse contract response:', parseError)
      console.log('Raw response:', stdout)
      count = 0
    }
    
    return NextResponse.json({
      success: true,
      count: count,
      contractId: contractId
    })

  } catch (error) {
    console.error('❌ Error calling smart contract:', error)
    
    // Return 0 instead of error to prevent UI from breaking
    return NextResponse.json({
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}