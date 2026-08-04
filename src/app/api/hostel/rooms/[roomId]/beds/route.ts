import { NextRequest, NextResponse } from 'next/server'
import { listBedsByRoom } from '@/features/admin/hostel/actions/bed-actions'

export const dynamic = 'force-dynamic'

/**
 * GET /api/hostel/rooms/:roomId/beds
 * Retrieve all beds for a specific room
 * 
 * Requirements: 2.7, 9.1
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params

    const beds = await listBedsByRoom(roomId)

    return NextResponse.json({ beds })
  } catch (error) {
    console.error('Error listing beds by room:', error)
    return NextResponse.json(
      { 
        error: 'Failed to list beds',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
