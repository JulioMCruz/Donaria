'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PinInput } from '@/components/ui/pin-input'
import { useAuth } from '@/contexts/AuthContext'
import { useWallet } from '@/contexts/WalletContext'
import { toast } from 'sonner'
import { Lock } from 'lucide-react'

interface PinProtectedActionProps {
  children: React.ReactNode
  onUnlockSuccess: (privateKey: string, publicKey: string) => Promise<void> | void
  disabled?: boolean
  className?: string
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function PinProtectedAction({
  children,
  onUnlockSuccess,
  disabled,
  className,
  variant = 'default',
  size = 'default'
}: PinProtectedActionProps) {
  const { user } = useAuth()
  const { wallet, connectWallet } = useWallet()
  const [showPinDialog, setShowPinDialog] = useState(false)
  const [pinLoading, setPinLoading] = useState(false)
  const [pinError, setPinError] = useState('')

  const handleClick = async () => {
    if (!user) {
      toast.error('Please log in first')
      return
    }

    // If wallet is already unlocked, proceed directly
    if (wallet?.privateKey) {
      try {
        await onUnlockSuccess(wallet.privateKey, wallet.publicKey!)
      } catch (error) {
        console.error('Action failed:', error)
        toast.error('Action failed. Please try again.')
      }
      return
    }

    // Show PIN dialog to unlock wallet
    setPinError('')
    setShowPinDialog(true)
  }

  const handleUnlockWallet = async (pin: string) => {
    if (!user?.uid) {
      setPinError('User not found')
      return
    }

    try {
      setPinLoading(true)
      setPinError('')
      
      console.log('🔐 Unlocking wallet for action...')
      
      // Call the unlock API
      const response = await fetch('/api/unlock-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: user.uid,
          pin
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        console.error('❌ Unlock API failed:', data.error)
        setPinError(data.error === 'Invalid PIN' ? 'Invalid PIN. Please try again.' : 'Failed to unlock wallet. Please try again.')
        return
      }

      const { privateKey, publicKey } = data
      console.log('✅ Wallet unlocked successfully')
      
      // Connect wallet
      connectWallet(privateKey, publicKey)
      setShowPinDialog(false)
      
      // Execute the protected action
      try {
        await onUnlockSuccess(privateKey, publicKey)
        toast.success('Action completed successfully!')
      } catch (actionError) {
        console.error('❌ Protected action failed:', actionError)
        toast.error('Action failed. Please try again.')
      }
      
    } catch (error) {
      console.error('❌ Unexpected unlock error:', error)
      setPinError('An unexpected error occurred. Please try again.')
    } finally {
      setPinLoading(false)
    }
  }

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={disabled}
        className={className}
        variant={variant}
        size={size}
      >
        {!wallet?.privateKey && (
          <Lock className="mr-2 h-4 w-4" />
        )}
        {children}
      </Button>

      {/* PIN Dialog */}
      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Unlock Wallet</DialogTitle>
            <DialogDescription>
              Enter your 4-digit PIN to unlock your wallet and complete this action.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <PinInput
              onComplete={handleUnlockWallet}
              loading={pinLoading}
              error={pinError}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}