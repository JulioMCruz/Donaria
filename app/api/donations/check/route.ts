import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const needId = searchParams.get('needId')
    const userWallet = searchParams.get('userWallet')

    if (!needId || !userWallet) {
      return NextResponse.json(
        { error: 'needId and userWallet parameters are required' },
        { status: 400 }
      )
    }

    console.log('🔍 Checking donation status for:', {
      needId,
      userWallet: userWallet.substring(0, 10) + '...'
    })

    const donationsRef = adminDb.collection('donations')
    const query = await donationsRef
      .where('needId', '==', needId)
      .where('fromWallet', '==', userWallet)
      .where('status', '==', 'completed')
      .limit(1)
      .get()

    const hasDonated = !query.empty

    console.log('✅ Donation check result:', { hasDonated })

    return NextResponse.json({
      success: true,
      hasDonated,
      donationCount: query.size
    })

  } catch (error: any) {
    console.error('❌ Error checking donation status:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to check donation status'
    }, { status: 500 })
  }
}