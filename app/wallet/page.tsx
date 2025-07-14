'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { WalletDashboard } from '@/components/wallet-dashboard'
import { PinInput } from '@/components/ui/pin-input'
import { useAuth } from '@/contexts/AuthContext'
import { useWallet } from '@/contexts/WalletContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, Wallet } from 'lucide-react'
import { decryptPrivateKey } from '@/lib/crypto'
import { toast } from 'sonner'

export default function WalletPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { wallet, connectWallet, refreshAccount } = useWallet()
  const [encryptedWallet, setEncryptedWallet] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [needsUnlock, setNeedsUnlock] = useState(false)

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    // Check if wallet is already connected
    if (user && !wallet.isConnected) {
      checkWalletStatus()
    }
  }, [user, authLoading, router, wallet.isConnected])

  const checkWalletStatus = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      const response = await fetch(`/api/users?firebaseUid=${user.uid}`)
      const data = await response.json()
      
      if (data.exists && data.hasWallet && data.user?.encryptedWallet) {
        setEncryptedWallet(data.user.encryptedWallet)
        setNeedsUnlock(true)
      } else {
        // User doesn't have a wallet yet, redirect to login to create one
        router.push('/login')
      }
      
    } catch (error) {
      console.error('Wallet status check error:', error)
      setError('Failed to check wallet status')
      toast.error("Failed to check wallet status")
    } finally {
      setLoading(false)
    }
  }

  const handleUnlockWallet = async (pin: string) => {
    if (!encryptedWallet) return

    try {
      setLoading(true)
      setError('')

      const privateKey = decryptPrivateKey(encryptedWallet, pin)
      const { Keypair } = await import('@stellar/stellar-sdk')
      const keypair = Keypair.fromSecret(privateKey)
      const publicKey = keypair.publicKey()

      connectWallet(privateKey, publicKey)
      setNeedsUnlock(false)

      toast.success("Wallet unlocked successfully!")
      
      // Refresh account information
      setTimeout(() => {
        refreshAccount()
      }, 500)
      
    } catch (error) {
      console.error('Wallet unlock error:', error)
      setError('Invalid PIN. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSendPayment = () => {
    toast.info("Send Payment feature coming soon! This will integrate with Donaria's donation system.")
  }

  const handleAnchorInteraction = () => {
    toast.info("Anchor Services (SEP-24 deposits/withdrawals) coming soon!")
  }

  // Show loading while checking authentication or wallet status
  if (authLoading || (user && !wallet.isConnected && !needsUnlock && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading wallet...</p>
        </div>
      </div>
    )
  }

  // Show message if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Please log in to access your wallet
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show PIN input if wallet needs to be unlocked
  if (needsUnlock && !wallet.isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="text-lg">
                      {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 -right-2 bg-teal-500 rounded-full p-1">
                    <Wallet className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <CardTitle>Unlock Your Wallet</CardTitle>
              <CardDescription>
                {user.name || user.email}<br/>
                Enter your 4-digit PIN to access your Donaria wallet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PinInput
                onComplete={handleUnlockWallet}
                loading={loading}
                error={error}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Show wallet dashboard if wallet is connected
  if (wallet.isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Your Donaria Wallet
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your Stellar wallet and view your XLM balance. Your wallet is used for transparent donations on the blockchain.
            </p>
          </div>

          <div className="flex justify-center">
            <WalletDashboard
              onSendPayment={handleSendPayment}
              onAnchorInteraction={handleAnchorInteraction}
            />
          </div>
        </div>
      </div>
    )
  }

  // Fallback - should not reach here
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Wallet not available. Please contact support.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}