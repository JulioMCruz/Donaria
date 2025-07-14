import type { NextApiRequest, NextApiResponse } from 'next'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('📝 Soroban API: Storing message in smart contract')
    
    const { contractId, userAddress, message, network } = req.body
    
    if (!contractId || !userAddress || !message || !network) {
      return res.status(400).json({ error: 'Missing required parameters' })
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
      messageCount = parseInt(stdout.trim())
    } catch (error) {
      console.log('⚠️ Could not parse message count, using 0')
    }
    
    return res.status(200).json({
      success: true,
      messageCount,
      contractId,
      userAddress,
      message,
      network
    })
    
  } catch (error: any) {
    console.error('❌ Store message error:', error)
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to store message',
      details: error.toString()
    })
  }
}