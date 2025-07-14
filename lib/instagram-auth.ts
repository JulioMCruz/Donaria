import { SocialUserInfo } from './auth'

export interface InstagramUserInfo {
  id: string
  username: string
  account_type: string
  media_count?: number
}

export const instagramAuthService = {
  async signInWithInstagram(): Promise<SocialUserInfo> {
    try {
      console.log('📸 Starting Instagram authentication...')
      
      // Get Instagram OAuth configuration from environment variables
      const clientId = process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      const redirectUri = `${baseUrl}/auth/instagram/callback`
      
      console.log('📸 Base URL:', baseUrl)
      console.log('📸 Client ID:', clientId)
      console.log('📸 Redirect URI:', redirectUri)
      
      if (!clientId) {
        throw new Error('Instagram Client ID not configured')
      }
      
      // Build Instagram OAuth URL exactly as Instagram expects (no encoding)
      const scope = 'instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments,instagram_business_content_publish,instagram_business_manage_insights'
      const authUrl = `https://www.instagram.com/oauth/authorize?force_reauth=true&client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`
      
      console.log('📸 Redirecting to Instagram OAuth:', authUrl)
      console.log('📸 Redirect URI being sent:', redirectUri)
      
      // Redirect to Instagram OAuth
      window.location.href = authUrl
      
      // Return placeholder - actual authentication handled by callback
      return {
        uid: '',
        email: '', // Instagram doesn't provide email
        name: '',
        avatar: '',
        provider: 'instagram'
      }
      
    } catch (error) {
      console.error('❌ Instagram login error:', error)
      throw new Error(`Instagram login failed: ${error}`)
    }
  },

  async handleInstagramCallback(authCode: string): Promise<SocialUserInfo> {
    try {
      console.log('📸 Processing Instagram callback with auth code')
      
      // Exchange auth code for access token
      const response = await fetch('/api/auth/instagram/exchange', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: authCode })
      })
      
      if (!response.ok) {
        throw new Error('Failed to exchange Instagram auth code')
      }
      
      const data = await response.json()
      
      return {
        uid: data.user_id || '',
        email: '', // Instagram doesn't provide email
        name: data.username || '',
        avatar: data.profile_picture || '', // Instagram profile picture from latest media
        provider: 'instagram'
      }
      
    } catch (error) {
      console.error('❌ Instagram callback processing error:', error)
      throw new Error(`Instagram callback failed: ${error}`)
    }
  }
}