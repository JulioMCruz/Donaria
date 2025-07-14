'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { Mail, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

interface EmailAuthProps {
  onSuccess: () => void
  onBack: () => void
}

export function EmailAuth({ onSuccess, onBack }: EmailAuthProps) {
  const { signInWithEmail, signUpWithEmail } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      toast.error('Email and password are required')
      return false
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return false
    }

    if (isSignUp) {
      if (!formData.name) {
        toast.error('Name is required for sign up')
        return false
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match')
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      setLoading(true)
      
      if (isSignUp) {
        await signUpWithEmail(formData.email, formData.password, formData.name)
        toast.success('Account created successfully!')
      } else {
        await signInWithEmail(formData.email, formData.password)
        toast.success('Signed in successfully!')
      }
      
      onSuccess()
      
    } catch (error: any) {
      console.error('Email auth error:', error)
      let errorMessage = 'Authentication failed'
      
      if (error.message.includes('auth/user-not-found')) {
        errorMessage = 'No account found with this email'
      } else if (error.message.includes('auth/wrong-password')) {
        errorMessage = 'Incorrect password'
      } else if (error.message.includes('auth/email-already-in-use')) {
        errorMessage = 'Email already in use'
      } else if (error.message.includes('auth/weak-password')) {
        errorMessage = 'Password is too weak'
      } else if (error.message.includes('auth/invalid-email')) {
        errorMessage = 'Invalid email address'
      }
      
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="absolute left-6"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Mail className="w-8 h-8 text-blue-600" />
        </div>
        <CardTitle className="text-2xl font-bold">
          {isSignUp ? 'Create Account' : 'Sign In'}
        </CardTitle>
        <CardDescription>
          {isSignUp 
            ? 'Create your Stellar Wallet account with email'
            : 'Sign in to your Stellar Wallet account'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Full Name
              </label>
              <Input
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={loading}
                required={isSignUp}
              />
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Email Address
            </label>
            <Input
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={loading}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                disabled={loading}
                required
                minLength={6}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {isSignUp && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                disabled={loading}
                required={isSignUp}
                minLength={6}
              />
            </div>
          )}
          
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Mail className="w-5 h-5 mr-2" />
            )}
            {isSignUp ? 'Create Account' : 'Sign In'}
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <Button
            variant="link"
            onClick={() => setIsSignUp(!isSignUp)}
            disabled={loading}
            className="text-sm"
          >
            {isSignUp 
              ? 'Already have an account? Sign in'
              : "Don't have an account? Sign up"
            }
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}