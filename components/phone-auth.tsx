'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { Phone, Loader2, ArrowLeft, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmationResult, RecaptchaVerifier } from 'firebase/auth'

interface PhoneAuthProps {
  onSuccess: () => void
  onBack: () => void
}

export function PhoneAuth({ onSuccess, onBack }: PhoneAuthProps) {
  const { setupRecaptcha, sendPhoneVerification, verifyPhoneCode } = useAuth()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'phone' | 'verification'>('phone')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null)
  const [countdown, setCountdown] = useState(0)
  const [rateLimited, setRateLimited] = useState(false)

  useEffect(() => {
    // Initialize reCAPTCHA when component mounts
    const initializeRecaptcha = async () => {
      try {
        console.log('🔄 Initializing reCAPTCHA...')
        const verifier = await setupRecaptcha('recaptcha-container')
        setRecaptchaVerifier(verifier)
        console.log('✅ reCAPTCHA initialized successfully')
      } catch (error) {
        console.error('❌ Failed to initialize reCAPTCHA:', error)
        console.error('Error details:', error)
        toast.error('Failed to initialize verification. Please refresh the page.')
      }
    }

    if (step === 'phone') {
      console.log('📱 Phone auth step - initializing reCAPTCHA')
      initializeRecaptcha()
    }

    return () => {
      // Cleanup reCAPTCHA when component unmounts
      if (recaptchaVerifier) {
        console.log('🧹 Cleaning up reCAPTCHA verifier')
        recaptchaVerifier.clear()
      }
    }
  }, [step])

  useEffect(() => {
    // Countdown timer for resend
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const formatPhoneNumber = (phone: string) => {
    console.log('📞 Formatting phone number:', phone)
    
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '')
    console.log('📞 Extracted digits:', digits)
    
    let formatted = phone
    
    // Add country code if not present
    if (digits.length === 10) {
      formatted = `+1${digits}` // Default to US
    } else if (digits.length === 11 && digits.startsWith('1')) {
      formatted = `+${digits}`
    } else if (!phone.startsWith('+')) {
      formatted = `+${digits}`
    }
    
    console.log('📞 Formatted phone number:', formatted)
    return formatted
  }

  const validatePhoneNumber = (phone: string) => {
    const formatted = formatPhoneNumber(phone)
    // Basic validation for international phone numbers
    const isValid = /^\+[1-9]\d{1,14}$/.test(formatted)
    console.log('✅ Phone validation result:', { phone, formatted, isValid })
    return isValid
  }

  const handleSendVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('🚀 Starting phone verification process...')
    console.log('📱 Phone number input:', phoneNumber)
    console.log('🤖 reCAPTCHA verifier status:', !!recaptchaVerifier)
    
    if (!validatePhoneNumber(phoneNumber)) {
      console.log('❌ Phone number validation failed')
      toast.error('Please enter a valid phone number')
      return
    }

    if (!recaptchaVerifier) {
      console.log('❌ reCAPTCHA verifier not available')
      toast.error('reCAPTCHA not initialized. Please refresh the page.')
      return
    }

    try {
      setLoading(true)
      const formattedPhone = formatPhoneNumber(phoneNumber)
      console.log('📞 Sending verification to:', formattedPhone)
      
      const confirmation = await sendPhoneVerification(formattedPhone, recaptchaVerifier)
      console.log('✅ Verification sent successfully, confirmation result:', confirmation)
      
      setConfirmationResult(confirmation)
      setStep('verification')
      setCountdown(60) // 60 seconds countdown
      
      toast.success('Verification code sent to your phone!')
      
    } catch (error: any) {
      console.error('❌ Phone verification error:', error)
      console.error('Error message:', error.message)
      console.error('Error code:', error.code)
      console.error('Full error object:', error)
      
      let errorMessage = 'Failed to send verification code'
      
      if (error.message.includes('auth/billing-not-enabled')) {
        errorMessage = 'Phone authentication requires Firebase billing to be enabled. Please upgrade your Firebase project to the Blaze plan or use email authentication instead.'
      } else if (error.message.includes('auth/invalid-app-credential')) {
        errorMessage = 'Firebase configuration error. Please check your Firebase project settings and ensure phone authentication is properly configured.'
      } else if (error.message.includes('auth/invalid-phone-number')) {
        errorMessage = 'Invalid phone number format'
      } else if (error.message.includes('auth/too-many-requests')) {
        errorMessage = 'Too many verification attempts. Please wait 15-30 minutes before trying again, or use email authentication instead.'
        setRateLimited(true)
      } else if (error.message.includes('auth/quota-exceeded')) {
        errorMessage = 'SMS quota exceeded. Please try again later.'
      } else if (error.code) {
        errorMessage = `Error: ${error.code} - ${error.message}`
      }
      
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('🔐 Starting code verification...')
    console.log('📝 Verification code entered:', verificationCode)
    console.log('📋 Confirmation result available:', !!confirmationResult)
    
    if (!verificationCode || verificationCode.length !== 6) {
      console.log('❌ Invalid verification code length:', verificationCode.length)
      toast.error('Please enter the 6-digit verification code')
      return
    }

    if (!confirmationResult) {
      console.log('❌ No confirmation result available')
      toast.error('No verification in progress. Please request a new code.')
      return
    }

    try {
      setLoading(true)
      console.log('🔄 Verifying code with Firebase...')
      
      const result = await verifyPhoneCode(confirmationResult, verificationCode)
      console.log('✅ Phone verification successful:', result)
      
      toast.success('Phone verified successfully!')
      onSuccess()
      
    } catch (error: any) {
      console.error('❌ Code verification error:', error)
      console.error('Error message:', error.message)
      console.error('Error code:', error.code)
      console.error('Full error object:', error)
      
      let errorMessage = 'Invalid verification code'
      
      if (error.message.includes('auth/invalid-verification-code')) {
        errorMessage = 'Invalid verification code'
      } else if (error.message.includes('auth/code-expired')) {
        errorMessage = 'Verification code has expired'
      } else if (error.code) {
        errorMessage = `Error: ${error.code} - ${error.message}`
      }
      
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (countdown > 0) return
    
    setVerificationCode('')
    setStep('phone')
    setConfirmationResult(null)
  }

  const handleBack = () => {
    if (step === 'verification') {
      setStep('phone')
      setVerificationCode('')
      setConfirmationResult(null)
    } else {
      onBack()
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="absolute left-6"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          {step === 'phone' ? (
            <Phone className="w-8 h-8 text-green-600" />
          ) : (
            <Shield className="w-8 h-8 text-green-600" />
          )}
        </div>
        <CardTitle className="text-2xl font-bold">
          {step === 'phone' ? 'Phone Verification' : 'Enter Code'}
        </CardTitle>
        <CardDescription>
          {step === 'phone' 
            ? 'Enter your phone number to receive a verification code'
            : `Enter the 6-digit code sent to ${phoneNumber}`
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 'phone' ? (
          <form onSubmit={handleSendVerification} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <Input
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={loading}
                required
              />
              <p className="text-xs text-gray-500">
                Include country code (e.g., +1 for US)
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
                <p className="text-xs text-amber-700">
                  <strong>Note:</strong> Phone authentication requires Firebase billing to be enabled (Blaze plan). 
                  If you encounter rate limiting or billing errors, please use email authentication instead.
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  <strong>For testing:</strong> Try +1 555-0100 with verification code 123456 (if test numbers are configured)
                </p>
              </div>
            </div>
            
            {/* reCAPTCHA container */}
            <div id="recaptcha-container" className="flex justify-center"></div>
            
            <Button
              type="submit"
              disabled={loading || !phoneNumber || rateLimited}
              className="w-full h-12"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Phone className="w-5 h-5 mr-2" />
              )}
              {rateLimited ? 'Rate Limited - Try Later' : 'Send Verification Code'}
            </Button>
            
            {rateLimited && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                <p className="text-xs text-red-700">
                  <strong>Rate Limited:</strong> Too many attempts detected. Please wait 15-30 minutes or use email authentication.
                </p>
              </div>
            )}
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Verification Code
              </label>
              <Input
                type="text"
                placeholder="123456"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                disabled={loading}
                required
                maxLength={6}
                className="text-center text-2xl tracking-widest"
              />
              <p className="text-xs text-gray-500 text-center">
                Enter the 6-digit code from SMS
              </p>
            </div>
            
            <Button
              type="submit"
              disabled={loading || verificationCode.length !== 6}
              className="w-full h-12"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Shield className="w-5 h-5 mr-2" />
              )}
              Verify Code
            </Button>
            
            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={handleResendCode}
                disabled={countdown > 0}
                className="text-sm"
              >
                {countdown > 0 
                  ? `Resend code in ${countdown}s`
                  : 'Resend verification code'
                }
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}