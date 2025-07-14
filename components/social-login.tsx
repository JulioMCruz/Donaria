'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { Chrome, Twitter, Camera, Mail, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { EmailAuth } from './email-auth'
import { PhoneAuth } from './phone-auth'

interface SocialLoginProps {
  onSuccess: () => void
}

type AuthMethod = 'social' | 'email' | 'phone'

export function SocialLogin({ onSuccess }: SocialLoginProps) {
  const { signInWithGoogle, signInWithTwitter, signInWithInstagram } = useAuth()
  const [loading, setLoading] = useState<string | null>(null)
  const [authMethod, setAuthMethod] = useState<AuthMethod>('social')

  const handleSocialLogin = async (provider: 'google' | 'twitter' | 'instagram') => {
    try {
      setLoading(provider)
      
      if (provider === 'google') {
        await signInWithGoogle()
      } else if (provider === 'twitter') {
        await signInWithTwitter()
      } else if (provider === 'instagram') {
        await signInWithInstagram()
      }
      
      onSuccess()
      
    } catch (error) {
      console.error(`${provider} login error:`, error)
      toast.error(`${provider} login failed. Please try again.`)
    } finally {
      setLoading(null)
    }
  }

  const socialProviders = [
    {
      id: 'google' as const,
      name: 'Google',
      icon: Chrome,
      className: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300',
    },
    {
      id: 'twitter' as const,
      name: 'X (Twitter)',
      icon: Twitter,
      className: 'bg-black hover:bg-gray-800 text-white',
    },
    {
      id: 'instagram' as const,
      name: 'Instagram',
      icon: Camera,
      className: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white',
    },
  ]

  // Handle switching back to main auth method selection
  const handleBackToSocial = () => {
    setAuthMethod('social')
  }

  // Render different authentication methods based on selection
  if (authMethod === 'email') {
    return <EmailAuth onSuccess={onSuccess} onBack={handleBackToSocial} />
  }

  if (authMethod === 'phone') {
    return <PhoneAuth onSuccess={onSuccess} onBack={handleBackToSocial} />
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Welcome to Donaria</CardTitle>
        <CardDescription>
          Connecting verified needs with direct aid using blockchain technology
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Email and Phone Auth Buttons */}
        <div className="space-y-3">
          <Button
            onClick={() => setAuthMethod('email')}
            disabled={!!loading}
            variant="outline"
            className="w-full h-12 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
          >
            <Mail className="w-5 h-5 mr-2" />
            Continue with Email
          </Button>
          
          {/* <Button
            onClick={() => setAuthMethod('phone')}
            disabled={!!loading}
            variant="outline"
            className="w-full h-12 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
          >
            <Phone className="w-5 h-5 mr-2" />
            Continue with Phone
          </Button> */}
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">Or continue with</span>
          </div>
        </div>

        {/* Social Login Buttons */}
        <div className="space-y-3">
          {socialProviders.map((provider) => {
            const Icon = provider.icon
            const isLoading = loading === provider.id
            
            return (
              <Button
                key={provider.id}
                onClick={() => handleSocialLogin(provider.id)}
                disabled={!!loading}
                className={`w-full h-12 ${provider.className}`}
                variant="outline"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Icon className="w-5 h-5 mr-2" />
                )}
                Continue with {provider.name}
              </Button>
            )
          })}
        </div>
        
        <div className="text-center pt-2">
          <p className="text-xs text-gray-500">
            Secure authentication with encrypted wallet creation
          </p>
        </div>
      </CardContent>
    </Card>
  )
}