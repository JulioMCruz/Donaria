import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  TwitterAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  signOut,
  User,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth'
import { auth } from './firebase'

const googleProvider = new GoogleAuthProvider()
const twitterProvider = new TwitterAuthProvider()

export interface SocialUserInfo {
  uid: string
  email?: string
  name: string
  avatar?: string
  provider: string
}

export interface PhoneAuthResult {
  confirmationResult: ConfirmationResult
  verificationId: string
}

export const authService = {
  async signInWithGoogle(): Promise<SocialUserInfo> {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const user = result.user
      
      return {
        uid: user.uid,
        email: user.email || '',
        name: user.displayName || '',
        avatar: user.photoURL || '',
        provider: 'google'
      }
    } catch (error) {
      throw new Error(`Google login failed: ${error}`)
    }
  },

  async signInWithTwitter(): Promise<SocialUserInfo> {
    try {
      const result = await signInWithPopup(auth, twitterProvider)
      const user = result.user
      
      return {
        uid: user.uid,
        email: user.email || '',
        name: user.displayName || '',
        avatar: user.photoURL || '',
        provider: 'twitter'
      }
    } catch (error) {
      throw new Error(`Twitter login failed: ${error}`)
    }
  },

  async signOut(): Promise<void> {
    try {
      await signOut(auth)
    } catch (error) {
      throw new Error(`Logout failed: ${error}`)
    }
  },

  getCurrentUser(): User | null {
    return auth.currentUser
  },

  onAuthStateChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback)
  },

  async signInWithEmail(email: string, password: string): Promise<SocialUserInfo> {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      const user = result.user
      
      return {
        uid: user.uid,
        email: user.email || '',
        name: user.displayName || user.email?.split('@')[0] || '',
        avatar: user.photoURL || '',
        provider: 'email'
      }
    } catch (error) {
      throw new Error(`Email login failed: ${error}`)
    }
  },

  async signUpWithEmail(email: string, password: string, name?: string): Promise<SocialUserInfo> {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      const user = result.user
      
      // Update profile with name if provided
      if (name) {
        await updateProfile(user, { displayName: name })
      }
      
      return {
        uid: user.uid,
        email: user.email || '',
        name: name || user.email?.split('@')[0] || '',
        avatar: user.photoURL || '',
        provider: 'email'
      }
    } catch (error) {
      throw new Error(`Email signup failed: ${error}`)
    }
  },

  async setupRecaptcha(containerId: string): Promise<RecaptchaVerifier> {
    console.log('🔧 Setting up reCAPTCHA with container ID:', containerId)
    
    const recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'normal',
      callback: () => {
        console.log('✅ reCAPTCHA solved successfully')
      },
      'expired-callback': () => {
        console.log('⏰ reCAPTCHA expired, user needs to solve again')
      }
    })
    
    console.log('✅ reCAPTCHA verifier created')
    return recaptchaVerifier
  },

  async sendPhoneVerification(phoneNumber: string, recaptchaVerifier: RecaptchaVerifier): Promise<ConfirmationResult> {
    try {
      console.log('📞 Sending phone verification...')
      console.log('- Phone number:', phoneNumber)
      console.log('- reCAPTCHA verifier:', !!recaptchaVerifier)
      console.log('- Auth instance:', !!auth)
      
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier)
      console.log('✅ Phone verification sent successfully')
      console.log('- Confirmation result:', confirmationResult)
      
      return confirmationResult
    } catch (error) {
      console.error('❌ Phone verification failed in auth service:', error)
      throw new Error(`Phone verification failed: ${error}`)
    }
  },

  async verifyPhoneCode(confirmationResult: ConfirmationResult, verificationCode: string): Promise<SocialUserInfo> {
    try {
      console.log('🔐 Verifying phone code...')
      console.log('- Verification code:', verificationCode)
      console.log('- Confirmation result:', !!confirmationResult)
      
      const result = await confirmationResult.confirm(verificationCode)
      console.log('✅ Phone code verified successfully')
      console.log('- User result:', result.user)
      
      const user = result.user
      
      const userInfo = {
        uid: user.uid,
        email: user.email || '',
        name: user.displayName || user.phoneNumber || '',
        avatar: user.photoURL || '',
        provider: 'phone'
      }
      
      console.log('✅ User info created:', userInfo)
      return userInfo
    } catch (error) {
      console.error('❌ Phone code verification failed in auth service:', error)
      throw new Error(`Phone verification failed: ${error}`)
    }
  },

  parseFirebaseUser(user: User): SocialUserInfo {
    let provider = 'email'
    let avatar = user.photoURL || ''
    let name = user.displayName || user.email?.split('@')[0] || user.phoneNumber || ''
    
    // Check custom claims for Instagram users
    if (user.uid.startsWith('instagram:')) {
      provider = 'instagram'
      // For Instagram users, try to get avatar and name from custom claims
      // Note: Custom claims are not directly accessible from the User object
      // They would need to be retrieved via getIdTokenResult() if needed
    } else if (user.providerData[0]?.providerId.includes('google')) {
      provider = 'google'
    } else if (user.providerData[0]?.providerId.includes('twitter')) {
      provider = 'twitter'
    } else if (user.providerData[0]?.providerId.includes('phone')) {
      provider = 'phone'
    }
    
    return {
      uid: user.uid,
      email: user.email || '',
      name: name,
      avatar: avatar,
      provider
    }
  }
}