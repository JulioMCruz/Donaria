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

    console.log('🔍 Checking vote status for:', {
      needId,
      userWallet: userWallet.substring(0, 10) + '...'
    })

    const votesRef = adminDb.collection('votes')
    const query = await votesRef
      .where('needId', '==', needId)
      .where('userWallet', '==', userWallet)
      .limit(1)
      .get()

    const hasVoted = !query.empty
    const voteData = hasVoted ? query.docs[0].data() : null

    console.log('✅ Vote check result:', { hasVoted, vote: voteData?.vote })

    return NextResponse.json({
      success: true,
      hasVoted,
      vote: voteData?.vote || null,
      voteId: hasVoted ? query.docs[0].id : null
    })

  } catch (error: any) {
    console.error('❌ Error checking vote status:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to check vote status'
    }, { status: 500 })
  }
}