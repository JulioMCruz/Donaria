import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const needId = searchParams.get('needId')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!needId) {
      return NextResponse.json(
        { error: 'needId parameter is required' },
        { status: 400 }
      )
    }

    console.log('📊 Fetching donations for need:', needId)

    const donationsRef = adminDb.collection('donations')
    const query = await donationsRef
      .where('needId', '==', needId)
      .where('status', '==', 'completed')
      .limit(limit)
      .offset(offset)
      .get()

    const donations = query.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        amount: data.amount,
        wallet: data.fromWallet,
        date: data.createdAt ? new Date(data.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        transactionHash: data.transactionHash,
        donorFirebaseUid: data.donorFirebaseUid,
        toWallet: data.toWallet,
        createdAt: data.createdAt // Keep for sorting
      }
    }).sort((a, b) => {
      // Sort by creation date, newest first
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
      return 0
    })

    console.log(`✅ Found ${donations.length} donations for need ${needId}`)

    return NextResponse.json({
      success: true,
      donations,
      totalCount: donations.length,
      hasMore: donations.length === limit
    })

  } catch (error: any) {
    console.error('❌ Error fetching donations:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch donations'
    }, { status: 500 })
  }
}