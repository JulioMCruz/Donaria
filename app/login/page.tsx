'use client'

import { useState, useEffect } from 'react'
import Link from "next/link"
import { HandHeart } from "lucide-react"
import { SocialLogin } from "@/components/social-login"
import { PinInput } from "@/components/ui/pin-input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useWallet } from '@/contexts/WalletContext'
import { generateWallet } from '@/lib/stellar-client'
import { encryptPrivateKey, decryptPrivateKey } from '@/lib/crypto'
import { toast } from 'sonner'

type LoginState = 'loading' | 'login' | 'create-pin' | 'enter-pin' | 'role-selection'

export default function LoginPage() {
  const [loginState, setLoginState] = useState<LoginState>('loading')
  const [encryptedWallet, setEncryptedWallet] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { user, loading: authLoading } = useAuth()
  const { connectWallet } = useWallet()

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        handleUserLogin()
      } else {
        setLoginState('login')
      }
    }
  }, [user, authLoading])

  const handleUserLogin = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      const response = await fetch(`/api/users?firebaseUid=${user.uid}`)
      const data = await response.json()
      
      if (data.exists && data.hasWallet && data.user?.encryptedWallet) {
        setEncryptedWallet(data.user.encryptedWallet)
        setLoginState('enter-pin')
      } else {
        setLoginState('create-pin')
      }
      
    } catch (error) {
      console.error('User login error:', error)
      setError('Failed to check user status')
      toast.error("Failed to check user status")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateWallet = async (pin: string) => {
    if (!user) return

    try {
      setLoading(true)
      setError('')
      console.log('🔄 Starting wallet creation process...')

      // Generate wallet on frontend
      console.log('🔑 Generating wallet keypair...')
      const wallet = await generateWallet()
      const encryptedPrivateKey = encryptPrivateKey(wallet.privateKey, pin)
      console.log('✅ Wallet generated and encrypted, public key:', wallet.publicKey)

      // Save user data FIRST (before funding)
      console.log('💾 Saving user data...')
      const userResponse = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebaseUid: user.uid,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          provider: user.provider,
          walletAddress: wallet.publicKey,
          encryptedWallet: encryptedPrivateKey,
          funded: false, // Initially not funded
          fundingTransactionHash: ''
        })
      })

      if (!userResponse.ok) {
        const userData = await userResponse.json()
        console.error('❌ User save error:', userData)
        throw new Error(userData.error || 'Failed to save user data')
      }

      const { user: savedUser } = await userResponse.json()
      console.log('✅ User data saved successfully')

      // Connect wallet (even if funding fails)
      connectWallet(wallet.privateKey, wallet.publicKey)
      setLoginState('role-selection')

      // Try to fund the wallet (non-blocking)
      console.log('💰 Attempting to fund wallet...')
      try {
        const fundingResponse = await fetch('/api/funding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicKey: wallet.publicKey })
        })

        const fundingData = await fundingResponse.json()
        
        if (fundingResponse.ok && fundingData.success) {
          console.log('✅ Wallet funded successfully:', fundingData.transactionHash)
          // Update user funding status
          await fetch(`/api/users/${savedUser.id}/fund`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              transactionHash: fundingData.transactionHash,
              funded: true
            })
          })
          toast.success(`Wallet Created & Funded! 🎉 Your wallet has been funded with ${fundingData.amount} XLM`)
          
          // Auto-refresh wallet balance after funding
          console.log('🔄 Auto-refreshing wallet balance after funding...')
          setTimeout(() => {
            if (wallet.publicKey) {
              // The wallet context will handle refreshing when we navigate to role selection
            }
          }, 2000) // Wait 2 seconds for network propagation
        } else {
          console.log('⚠️ Funding failed but wallet created:', fundingData.error)
          toast.success("Wallet Created! You can fund it manually later.")
        }
      } catch (fundingError) {
        console.error('⚠️ Funding failed but wallet created:', fundingError)
        toast.success("Wallet Created! Funding failed but you can fund it manually later.")
      }
      
    } catch (error) {
      console.error('❌ Wallet creation error:', error)
      setError('Failed to create wallet. Please try again.')
      toast.error(error instanceof Error ? error.message : "Failed to create wallet")
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
      setLoginState('role-selection')

      toast.success("Welcome back! Wallet unlocked successfully")
      
    } catch (error) {
      console.error('Wallet unlock error:', error)
      setError('Invalid PIN. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Redirect to role selection after successful authentication
  if (loginState === 'role-selection') {
    window.location.href = '/role-selection'
    return null
  }

  if (authLoading || loginState === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Initializing Donaria...</p>
        </div>
      </div>
    )
  }

  if (loginState === 'login') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950 p-4">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center justify-center gap-2 mb-6">
            <HandHeart className="h-8 w-8 text-teal-500" />
            <span className="font-bold text-2xl text-gray-800 dark:text-white">DONARIA</span>
          </Link>
          <SocialLogin onSuccess={() => {}} />
        </div>
      </div>
    )
  }

  if (loginState === 'create-pin' && user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950 p-4">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center justify-center gap-2 mb-6">
            <HandHeart className="h-8 w-8 text-teal-500" />
            <span className="font-bold text-2xl text-gray-800 dark:text-white">DONARIA</span>
          </Link>
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="text-lg">
                    {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle>Create Your Secure Wallet</CardTitle>
              <CardDescription>
                Welcome, {user.name || user.email}!<br/>
                Set a 4-digit PIN to secure your wallet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PinInput
                onComplete={handleCreateWallet}
                loading={loading}
                error={error}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (loginState === 'enter-pin' && user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950 p-4">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center justify-center gap-2 mb-6">
            <HandHeart className="h-8 w-8 text-teal-500" />
            <span className="font-bold text-2xl text-gray-800 dark:text-white">DONARIA</span>
          </Link>
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="text-lg">
                    {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle>Welcome Back!</CardTitle>
              <CardDescription>
                {user.name || user.email}<br/>
                Enter your PIN to unlock your wallet
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

  return null
}
