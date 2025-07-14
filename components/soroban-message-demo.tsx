'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PinProtectedAction } from '@/components/pin-protected-action'
import { messageStorageService } from '@/lib/soroban-contract'
import { useWallet } from '@/contexts/WalletContext'
import { toast } from 'sonner'

export function SorobanMessageDemo() {
  const { wallet } = useWallet()
  const [message, setMessage] = useState('')
  const [isStoring, setIsStoring] = useState(false)

  const handleStoreMessage = async (privateKey: string, publicKey: string) => {
    if (!message.trim()) {
      toast.error('Please enter a message')
      return
    }

    try {
      setIsStoring(true)
      console.log('📝 Storing message in Soroban contract...')
      
      // Store message using the user's private key
      const messageCount = await messageStorageService.storeMessageWithKey(
        publicKey,
        message.trim(),
        privateKey
      )
      
      console.log('✅ Message stored successfully! Total messages:', messageCount)
      toast.success(`Message stored successfully! Total messages: ${messageCount}`)
      
      // Clear the input
      setMessage('')
      
    } catch (error) {
      console.error('❌ Failed to store message:', error)
      toast.error('Failed to store message. Please try again.')
    } finally {
      setIsStoring(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Store Message on Soroban</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="message">Your Message</Label>
          <Input
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message..."
            disabled={isStoring}
          />
        </div>
        
        <PinProtectedAction
          onUnlockSuccess={handleStoreMessage}
          disabled={isStoring || !message.trim()}
          className="w-full"
        >
          {isStoring ? 'Storing Message...' : 'Store Message on Blockchain'}
        </PinProtectedAction>
        
        <p className="text-xs text-muted-foreground">
          {wallet?.privateKey 
            ? 'Your wallet is unlocked. Click to store message.'
            : 'Click to unlock your wallet and store the message on the Soroban smart contract.'
          }
        </p>
      </CardContent>
    </Card>
  )
}