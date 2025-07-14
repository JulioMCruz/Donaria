import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  try {
    console.log('🗳️ Processing vote submission...')
    
    const body = await request.json()
    const {
      needId,
      vote,
      userWallet,
      userFirebaseUid
    } = body

    // Validate required fields
    if (!needId || !vote || !userWallet || !userFirebaseUid) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!['up', 'down'].includes(vote)) {
      return NextResponse.json(
        { error: 'Vote must be either "up" or "down"' },
        { status: 400 }
      )
    }

    console.log('📝 Vote details:', {
      needId,
      vote,
      userWallet: userWallet.substring(0, 10) + '...',
      userFirebaseUid
    })

    // Check if user has already voted on this need
    const votesRef = adminDb.collection('votes')
    const existingVoteQuery = await votesRef
      .where('needId', '==', needId)
      .where('userWallet', '==', userWallet)
      .limit(1)
      .get()

    if (!existingVoteQuery.empty) {
      console.log('⚠️ User has already voted on this need')
      return NextResponse.json(
        { error: 'You have already voted on this need' },
        { status: 400 }
      )
    }

    // Check if user has actually donated to this need
    const donationsRef = adminDb.collection('donations')
    const donationQuery = await donationsRef
      .where('needId', '==', needId)
      .where('fromWallet', '==', userWallet)
      .where('status', '==', 'completed')
      .limit(1)
      .get()

    if (donationQuery.empty) {
      console.log('⚠️ User has not donated to this need')
      return NextResponse.json(
        { error: 'You can only vote on needs you have donated to' },
        { status: 400 }
      )
    }

    // Store the vote
    const voteRecord = {
      needId,
      vote,
      userWallet,
      userFirebaseUid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const voteDoc = await votesRef.add(voteRecord)
    console.log('✅ Vote recorded with ID:', voteDoc.id)

    return NextResponse.json({
      success: true,
      voteId: voteDoc.id,
      vote,
      message: 'Vote submitted successfully'
    })

  } catch (error: any) {
    console.error('❌ Error submitting vote:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to submit vote'
    }, { status: 500 })
  }
}