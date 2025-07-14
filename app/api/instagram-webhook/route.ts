import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('📸 Instagram webhook received')
    const body = await request.json()
    console.log('Webhook data:', body)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Instagram webhook error:', error)
    return NextResponse.json({ success: true }) // Always return success for webhooks
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    success: true,
    message: 'Instagram webhook endpoint active' 
  })
}