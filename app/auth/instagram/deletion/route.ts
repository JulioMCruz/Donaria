import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('📸 Instagram data deletion callback received')
    
    // Instagram sends a POST request for data deletion requests
    const body = await request.json()
    console.log('Deletion request data:', body)
    
    // Here you would typically:
    // 1. Process the data deletion request
    // 2. Delete user data from your systems
    // 3. Return confirmation URL and code
    
    return NextResponse.json({
      url: `${process.env.NEXTAUTH_URL}/data-deletion-status`,
      confirmation_code: `deletion_${Date.now()}`
    })
    
  } catch (error) {
    console.error('❌ Instagram deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to process deletion request' },
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
    console.log('✅ Instagram deletion webhook verified')
    return new Response(challenge, { status: 200 })
  }
  
  console.log('❌ Instagram deletion webhook verification failed')
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}