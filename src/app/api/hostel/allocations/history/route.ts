import { NextRequest, NextResponse } from 'next/server'
import { getAllocationHistory } from '@/features/admin/hostel/actions/allocation-actions'

export const dynamic = 'force-dynamic'

/**
 * GET /api/hostel/allocations/history
 * Retrieve allocation history including inactive allocations
 * 
 * Query Parameters:
 * - studentId: string (required)
 * 
 * Requirements: 7.1, 7.7, 9.1
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Get studentId parameter
    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          message: 'Missing required parameter: studentId'
        },
        { status: 400 }
      )
    }

    // Call service layer
    const allocations = await getAllocationHistory(studentId)

    return NextResponse.json({ allocations })
  } catch (error) {
    console.error('Error getting allocation history:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get allocation history',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
