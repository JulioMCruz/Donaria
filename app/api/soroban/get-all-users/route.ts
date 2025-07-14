import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    console.log('👥 Soroban API: Getting all users from smart contract')
    
    const { contractId, network } = await request.json()
    
    if (!contractId || !network) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    console.log('👥 Calling smart contract for all users:', {
      contractId,
      network
    })

    // Call the smart contract using Stellar CLI
    const command = `stellar contract invoke --id ${contractId} --source alice --network ${network} -- get_all_users`
    
    console.log('👥 Executing command:', command)
    
    const { stdout, stderr } = await execAsync(command, { 
      timeout: 30000,
      cwd: '/Users/osx/Projects/Stellar/mvp02/contracts-soroban/message-storage'
    })
    
    if (stderr) {
      console.error('❌ Contract call stderr:', stderr)
    }
    
    console.log('✅ Contract response:', stdout)
    
    // Parse the response - it should be a JSON array of address strings
    let users: string[] = []
    try {
      // The stellar CLI returns the result, we need to parse it
      const result = stdout.trim()
      if (result) {
        users = JSON.parse(result)
      }
    } catch (parseError) {
      console.error('❌ Failed to parse contract response:', parseError)
      console.log('Raw response:', stdout)
      users = []
    }
    
    return NextResponse.json({
      success: true,
      users: users,
      contractId: contractId
    })

  } catch (error) {
    console.error('❌ Error calling smart contract for all users:', error)
    
    // Return empty users instead of error to prevent UI from breaking
    return NextResponse.json({
      success: false,
      users: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}