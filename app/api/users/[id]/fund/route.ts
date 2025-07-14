import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { transactionHash, funded } = await request.json()
    const userId = params.id

    if (!transactionHash || typeof funded !== 'boolean') {
      return NextResponse.json(
        { error: 'transactionHash and funded status required' },
        { status: 400 }
      )
    }

    const userRef = adminDb.collection('users').doc(userId)
    
    await userRef.update({
      funded,
      fundingTransactionHash: transactionHash,
      fundedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: 'User funding status updated'
    })
  } catch (error) {
    console.error('Update funding error:', error)
    return NextResponse.json(
      { error: 'Failed to update funding status' },
      { status: 500 }
    )
  }
}