'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { instagramAuthService } from '@/lib/instagram-auth'
import { signInWithCustomToken } from 'firebase/auth'
import { auth } from '@/lib/firebase'

export default function InstagramCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState('Processing...')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('📸 Instagram callback received')
        console.log('Search params:', searchParams.toString())
        
        // Check for error
        const error = searchParams.get('error')
        if (error) {
          console.error('❌ Instagram OAuth error:', error)
          setStatus('Authentication failed')
          setTimeout(() => router.push('/?error=instagram_auth_failed'), 2000)
          return
        }

        // Check for authorization code
        const code = searchParams.get('code')
        if (!code) {
          console.error('❌ No authorization code received')
          setStatus('No authorization code received')
          setTimeout(() => router.push('/?error=no_auth_code'), 2000)
          return
        }

        console.log('✅ Authorization code received, processing...')
        setStatus('Exchanging authorization code...')
        
        // Exchange code for user info
        const userInfo = await instagramAuthService.handleInstagramCallback(code)
        console.log('📸 Instagram user info:', userInfo)
        
        setStatus('Creating Firebase custom token...')
        
        // Create Firebase custom token for Instagram user
        const tokenResponse = await fetch('/api/auth/instagram/create-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uid: userInfo.uid,
            email: userInfo.email,
            name: userInfo.name,
            avatar: userInfo.avatar,
            provider: 'instagram'
          })
        })
        
        if (!tokenResponse.ok) {
          throw new Error('Failed to create Firebase custom token')
        }
        
        const { customToken } = await tokenResponse.json()
        
        setStatus('Signing in to Firebase...')
        
        // Sign in to Firebase with custom token
        const credential = await signInWithCustomToken(auth, customToken)
        
        // Update Firebase user profile with Instagram data
        if (credential.user && userInfo.name) {
          try {
            const { updateProfile } = await import('firebase/auth')
            await updateProfile(credential.user, {
              displayName: userInfo.name,
              photoURL: userInfo.avatar || null
            })
            console.log('✅ Firebase profile updated with Instagram data')
          } catch (error) {
            console.log('⚠️ Could not update Firebase profile:', error)
          }
        }
        
        setStatus('Success! Redirecting...')
        setTimeout(() => router.push('/'), 1000)
        
      } catch (error) {
        console.error('❌ Instagram callback error:', error)
        setStatus('Authentication failed')
        setTimeout(() => router.push('/?error=callback_failed'), 2000)
      }
    }

    handleCallback()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold mb-2">Processing Instagram Login...</h2>
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  )
}