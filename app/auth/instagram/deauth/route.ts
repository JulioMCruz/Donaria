import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('📸 Instagram deauthorization callback received')
    
    // Instagram sends a POST request when user deauthorizes the app
    const body = await request.json()
    console.log('Deauth data:', body)
    
    // Here you would typically:
    // 1. Log the deauthorization
    // 2. Clean up user data if required
    // 3. Update your database
    
    return NextResponse.json({ 
      success: true,
      message: 'Deauthorization processed' 
    })
    
  } catch (error) {
    console.error('❌ Instagram deauth error:', error)
    return NextResponse.json(
      { error: 'Failed to process deauthorization' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // Handle Facebook webhook verification
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')
  
  // Facebook webhook verification
  if (mode === 'subscribe' && token === 'stellar_wallet_verify_token') {
    console.log('✅ Instagram webhook verified')
    return new Response(challenge, { status: 200 })
  }
  
  console.log('❌ Instagram webhook verification failed')
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}