'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { User, ConfirmationResult, RecaptchaVerifier } from 'firebase/auth'
import { authService, type SocialUserInfo } from '@/lib/auth'
import { instagramAuthService } from '@/lib/instagram-auth'

interface AuthContextType {
  user: SocialUserInfo | null
  loading: boolean
  signInWithGoogle: () => Promise<SocialUserInfo>
  signInWithTwitter: () => Promise<SocialUserInfo>
  signInWithInstagram: () => Promise<SocialUserInfo>
  signInWithEmail: (email: string, password: string) => Promise<SocialUserInfo>
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<SocialUserInfo>
  setupRecaptcha: (containerId: string) => Promise<RecaptchaVerifier>
  sendPhoneVerification: (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => Promise<ConfirmationResult>
  verifyPhoneCode: (confirmationResult: ConfirmationResult, verificationCode: string) => Promise<SocialUserInfo>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SocialUserInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((firebaseUser: User | null) => {
      if (firebaseUser) {
        const userInfo = authService.parseFirebaseUser(firebaseUser)
        setUser(userInfo)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signInWithGoogle = async (): Promise<SocialUserInfo> => {
    const userInfo = await authService.signInWithGoogle()
    setUser(userInfo)
    return userInfo
  }

  const signInWithTwitter = async (): Promise<SocialUserInfo> => {
    const userInfo = await authService.signInWithTwitter()
    setUser(userInfo)
    return userInfo
  }

  const signInWithInstagram = async (): Promise<SocialUserInfo> => {
    // Instagram auth redirects to OAuth, so we don't get immediate response
    // Return placeholder and let the callback handle the actual authentication
    await instagramAuthService.signInWithInstagram()
    
    // Return placeholder - actual user will be set by Firebase auth state change
    return {
      uid: '',
      email: '',
      name: '',
      avatar: '',
      provider: 'instagram'
    }
  }

  const signInWithEmail = async (email: string, password: string): Promise<SocialUserInfo> => {
    const userInfo = await authService.signInWithEmail(email, password)
    setUser(userInfo)
    return userInfo
  }

  const signUpWithEmail = async (email: string, password: string, name?: string): Promise<SocialUserInfo> => {
    const userInfo = await authService.signUpWithEmail(email, password, name)
    setUser(userInfo)
    return userInfo
  }

  const setupRecaptcha = async (containerId: string): Promise<RecaptchaVerifier> => {
    return await authService.setupRecaptcha(containerId)
  }

  const sendPhoneVerification = async (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier): Promise<ConfirmationResult> => {
    return await authService.sendPhoneVerification(phoneNumber, recaptchaVerifier)
  }

  const verifyPhoneCode = async (confirmationResult: ConfirmationResult, verificationCode: string): Promise<SocialUserInfo> => {
    const userInfo = await authService.verifyPhoneCode(confirmationResult, verificationCode)
    setUser(userInfo)
    return userInfo
  }

  const signOut = async (): Promise<void> => {
    await authService.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signInWithGoogle,
      signInWithTwitter,
      signInWithInstagram,
      signInWithEmail,
      signUpWithEmail,
      setupRecaptcha,
      sendPhoneVerification,
      verifyPhoneCode,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}