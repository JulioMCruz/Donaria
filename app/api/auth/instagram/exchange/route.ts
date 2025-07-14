import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('📸 Instagram token exchange API called')
    
    const { code } = await request.json()
    
    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code is required' },
        { status: 400 }
      )
    }

    const clientId = process.env.AUTH_INSTAGRAM_ID
    const clientSecret = process.env.AUTH_INSTAGRAM_SECRET
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL
    const redirectUri = `${baseUrl}/auth/instagram/callback`

    if (!clientId || !clientSecret) {
      console.error('❌ Instagram credentials not configured')
      return NextResponse.json(
        { error: 'Instagram credentials not configured' },
        { status: 500 }
      )
    }

    console.log('📸 Exchanging auth code for access token...')

    // Step 1: Exchange code for short-lived access token using Graph API
    const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code: code,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('❌ Instagram token exchange failed:', errorText)
      return NextResponse.json(
        { error: 'Failed to exchange authorization code' },
        { status: 400 }
      )
    }

    const tokenData = await tokenResponse.json()
    console.log('✅ Instagram access token received')

    // Step 2: Get user profile information using Graph API
    const profileResponse = await fetch(`https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${tokenData.access_token}`)
    
    if (!profileResponse.ok) {
      console.error('❌ Failed to fetch Instagram profile')
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 400 }
      )
    }

    const profileData = await profileResponse.json()
    console.log('✅ Instagram profile data received:', profileData)

    // Step 3: Get profile picture from user's media (Instagram Graph API doesn't provide profile picture directly)
    let profilePicture = ''
    try {
      const mediaResponse = await fetch(`https://graph.instagram.com/me/media?fields=id,media_type,media_url,thumbnail_url,permalink&limit=1&access_token=${tokenData.access_token}`)
      
      if (mediaResponse.ok) {
        const mediaData = await mediaResponse.json()
        if (mediaData.data && mediaData.data.length > 0) {
          const latestMedia = mediaData.data[0]
          // Use thumbnail for videos, media_url for images
          profilePicture = latestMedia.media_type === 'VIDEO' ? 
            (latestMedia.thumbnail_url || latestMedia.media_url) : 
            latestMedia.media_url
          console.log('✅ Instagram profile picture URL:', profilePicture)
        }
      }
    } catch (error) {
      console.log('⚠️ Could not fetch Instagram media for profile picture:', error)
      // Not critical - continue without profile picture
    }

    // Return user information
    return NextResponse.json({
      success: true,
      user_id: profileData.id,
      username: profileData.username,
      account_type: profileData.account_type,
      media_count: profileData.media_count,
      profile_picture: profilePicture,
      access_token: tokenData.access_token,
    })

  } catch (error) {
    console.error('❌ Instagram token exchange error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}