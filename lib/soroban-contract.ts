/**
 * Soroban Smart Contract Integration
 * Handles interaction with the Message Storage contract
 */

export interface MessageStorageContract {
  contractId: string
  network: 'testnet' | 'mainnet'
}

export interface ContractMessage {
  message: string
  wallet: string
  timestamp?: Date
  index: number
}

export class SorobanContractService {
  private contractId: string
  private network: string

  constructor(config: MessageStorageContract) {
    this.contractId = config.contractId
    this.network = config.network
  }

  /**
   * Store a message in the contract using user's private key
   */
  async storeMessageWithKey(userAddress: string, message: string, privateKey: string): Promise<number> {
    try {
      console.log('🔐 Storing message in Soroban contract with user key:', {
        contract: this.contractId,
        user: userAddress,
        message: message,
        network: this.network
      })
      
      // Call the real smart contract using user's private key
      const response = await fetch('/api/soroban/store-message-with-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractId: this.contractId,
          userAddress: userAddress,
          message: message,
          network: this.network,
          privateKey: privateKey
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to store message: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to store message')
      }
      
      return data.messageCount || 0
      
    } catch (error) {
      console.error('❌ Error storing message with key:', error)
      throw new Error(`Failed to store message: ${error}`)
    }
  }

  /**
   * Store a message in the contract (legacy demo method)
   */
  async storeMessage(userAddress: string, message: string): Promise<number> {
    try {
      console.log('📝 Storing message in Soroban contract:', {
        contract: this.contractId,
        user: userAddress,
        message: message,
        network: this.network
      })
      
      // Call the real smart contract using API
      const response = await fetch('/api/soroban/store-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractId: this.contractId,
          userAddress: userAddress,
          message: message,
          network: this.network
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to store message: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to store message')
      }
      
      return data.messageCount || 0
      
    } catch (error) {
      console.error('❌ Error storing message:', error)
      throw new Error(`Failed to store message: ${error}`)
    }
  }

  /**
   * Get all messages for a user
   */
  async getUserMessages(userAddress: string): Promise<ContractMessage[]> {
    try {
      console.log('📖 Reading messages from Soroban contract:', {
        contract: this.contractId,
        user: userAddress,
        network: this.network
      })
      
      // Call the real smart contract using Stellar CLI
      const response = await fetch('/api/soroban/get-user-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractId: this.contractId,
          userAddress: userAddress,
          network: this.network
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // Transform the messages to include wallet info
      // Now messages include real timestamps from the smart contract
      return data.messages.map((messageData: any, index: number) => {
        // Handle both old format (string) and new format (object with timestamp)
        if (typeof messageData === 'string') {
          // Legacy message format - use index-based timestamp
          return {
            message: messageData,
            wallet: userAddress,
            index: index + 1,
            timestamp: new Date(Date.now() - (data.messages.length - index - 1) * 60000)
          }
        } else {
          // New message format with real timestamp from smart contract
          return {
            message: messageData.message || messageData,
            wallet: userAddress,
            index: index + 1,
            timestamp: messageData.timestamp ? new Date(messageData.timestamp * 1000) : new Date() // Convert from Unix timestamp
          }
        }
      })
      
    } catch (error) {
      console.error('❌ Error reading messages:', error)
      // Fallback to empty array if contract call fails
      return []
    }
  }

  /**
   * Get all users who have stored messages
   */
  async getAllUsers(): Promise<string[]> {
    try {
      console.log('👥 Getting all users from Soroban contract:', {
        contract: this.contractId,
        network: this.network
      })
      
      // Call the real smart contract using API
      const response = await fetch('/api/soroban/get-all-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractId: this.contractId,
          network: this.network
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`)
      }
      
      const data = await response.json()
      return data.users || []
      
    } catch (error) {
      console.error('❌ Error getting all users:', error)
      // Return empty array if contract call fails
      return []
    }
  }

  /**
   * Get total message count across all users
   */
  async getMessageCount(): Promise<number> {
    try {
      console.log('🔢 Getting message count from Soroban contract:', {
        contract: this.contractId,
        network: this.network
      })
      
      // Call the real smart contract using API
      const response = await fetch('/api/soroban/get-message-count', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractId: this.contractId,
          network: this.network
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch message count: ${response.statusText}`)
      }
      
      const data = await response.json()
      return data.count || 0
      
    } catch (error) {
      console.error('❌ Error getting message count:', error)
      // Return 0 if contract call fails
      return 0
    }
  }

  /**
   * Clear all messages for a user (requires authentication)
   */
  async clearUserMessages(userAddress: string): Promise<boolean> {
    try {
      console.log('🗑️ Clearing messages in Soroban contract:', {
        contract: this.contractId,
        user: userAddress,
        network: this.network
      })
      
      // In a real implementation, this would:
      // 1. Create a transaction to call clear_user_messages
      // 2. Sign with user's private key (authentication)
      // 3. Submit to network
      // 4. Return success status
      
      return Promise.resolve(true)
    } catch (error) {
      console.error('❌ Error clearing messages:', error)
      throw new Error(`Failed to clear messages: ${error}`)
    }
  }

  /**
   * Get contract information
   */
  getContractInfo() {
    return {
      contractId: this.contractId,
      network: this.network,
      explorerUrl: this.network === 'testnet' 
        ? `https://stellar.expert/explorer/testnet/contract/${this.contractId}`
        : `https://stellar.expert/explorer/public/contract/${this.contractId}`
    }
  }
}

// Default contract configuration for testnet
export const MESSAGE_STORAGE_CONTRACT: MessageStorageContract = {
  contractId: 'CD4RXDCGFTQGUO4Q3N2IU4RQXYGOL3236JK6KPBGCGSDSQ5ORY7A3KVF',
  network: 'testnet'
}

// Create default service instance
export const messageStorageService = new SorobanContractService(MESSAGE_STORAGE_CONTRACT)