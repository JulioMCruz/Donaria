'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { getAccountInfo, sendPayment } from '@/lib/stellar-client'
import { useAuth } from './AuthContext'

interface AccountInfo {
  balance: string
  sequence: string
  exists: boolean
  balances: any[]
  subentryCount: number
}

interface PaymentResult {
  hash: string
  success: boolean
  error?: string
}

interface WalletState {
  isConnected: boolean
  publicKey: string | null
  privateKey: string | null
  accountInfo: AccountInfo | null
}

interface WalletContextType {
  wallet: WalletState
  account: AccountInfo | null // Add account for compatibility with WalletDashboard
  connectWallet: (privateKey: string, publicKey: string) => void
  disconnectWallet: () => void
  refreshAccount: () => Promise<void>
  sendTransaction: (destination: string, amount: string, memo?: string) => Promise<PaymentResult>
  loadWalletFromFirebase: (firebaseUid: string) => Promise<void>
  loading: boolean
  error: string | null
  clearError: () => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    publicKey: null,
    privateKey: null,
    accountInfo: null,
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Function to load wallet data from Firebase
  const loadWalletFromFirebase = useCallback(async (firebaseUid: string) => {
    try {
      console.log('🔍 Loading wallet data from Firebase for user:', firebaseUid.substring(0, 10) + '...')
      setError(null)
      
      const response = await fetch(`/api/users/wallet?firebaseUid=${firebaseUid}`)
      const data = await response.json()
      
      if (response.ok && data.exists && data.publicKey) {
        console.log('✅ Wallet data loaded:', data.publicKey.substring(0, 10) + '...')
        setWallet(prev => ({
          ...prev,
          isConnected: true,
          publicKey: data.publicKey,
          // Note: privateKey is not loaded here for security - only when unlocked via PIN
        }))
      } else {
        console.log('⚠️ No wallet found in Firebase for user')
        setWallet(prev => ({
          ...prev,
          isConnected: false,
          publicKey: null,
          privateKey: null,
        }))
      }
    } catch (error) {
      console.error('❌ Error loading wallet from Firebase:', error)
      setError('Failed to load wallet information')
    }
  }, [])

  // Load wallet data when user authentication state changes
  useEffect(() => {
    if (user?.uid) {
      console.log('🔄 User authenticated, loading wallet data...')
      loadWalletFromFirebase(user.uid)
    } else {
      console.log('🚪 User logged out, clearing wallet data...')
      setWallet({
        isConnected: false,
        publicKey: null,
        privateKey: null,
        accountInfo: null,
      })
    }
  }, [user, loadWalletFromFirebase])

  const connectWallet = useCallback((privateKey: string, publicKey: string) => {
    setWallet({
      isConnected: true,
      publicKey,
      privateKey,
      accountInfo: null,
    })
    setError(null)
  }, [])

  const disconnectWallet = useCallback(() => {
    setWallet({
      isConnected: false,
      publicKey: null,
      privateKey: null,
      accountInfo: null,
    })
    setError(null)
  }, [])

  const refreshAccount = useCallback(async () => {
    if (!wallet.publicKey) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const accountInfo = await getAccountInfo(wallet.publicKey)
      
      // Only log significant changes to reduce console noise
      if (accountInfo.exists !== wallet.accountInfo?.exists) {
        console.log('🔄 Account status changed:', accountInfo.exists ? 'funded' : 'unfunded')
      }
      
      setWallet(prev => ({
        ...prev,
        accountInfo,
      }))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh account'
      setError(errorMessage)
      console.error('❌ Failed to refresh account:', err)
    } finally {
      setLoading(false)
    }
  }, [wallet.publicKey, wallet.accountInfo?.exists])

  const sendTransaction = useCallback(async (
    destination: string, 
    amount: string, 
    memo?: string
  ): Promise<PaymentResult> => {
    if (!wallet.privateKey) {
      throw new Error('Wallet not connected')
    }

    try {
      setLoading(true)
      setError(null)
      
      const result = await sendPayment(wallet.privateKey, destination, amount, memo)
      
      if (result.success) {
        // Refresh account after successful transaction
        await refreshAccount()
      }
      
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [wallet.privateKey, refreshAccount])

  return (
    <WalletContext.Provider value={{
      wallet,
      account: wallet.accountInfo, // Expose account for compatibility
      connectWallet,
      disconnectWallet,
      refreshAccount,
      sendTransaction,
      loadWalletFromFirebase,
      loading,
      error,
      clearError,
    }}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}