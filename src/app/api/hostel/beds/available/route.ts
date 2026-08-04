import { NextRequest, NextResponse } from 'next/server'
import { getAvailableBeds } from '@/features/admin/hostel/actions/bed-actions'

export const dynamic = 'force-dynamic'

/**
 * GET /api/hostel/beds/available
 * Get available beds, optionally filtered by room
 * 
 * Query Parameters:
 * - roomId: string (optional)
 * 
 * Requirements: 2.8, 9.1
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const roomId = searchParams.get('roomId') || undefined

    const beds = await getAvailableBeds(roomId)

    return NextResponse.json(beds)
  } catch (error) {
    console.error('Error getting available beds:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get available beds',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
