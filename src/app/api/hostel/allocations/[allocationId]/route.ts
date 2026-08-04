import { NextRequest, NextResponse } from 'next/server'
import { getAllocationById } from '@/features/admin/hostel/actions/allocation-actions'

export const dynamic = 'force-dynamic'

/**
 * GET /api/hostel/allocations/:allocationId
 * Retrieve a single allocation by ID
 * 
 * Path Parameters:
 * - allocationId: string (required)
 * 
 * Requirements: 3.6, 9.1
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ allocationId: string }> }
) {
  try {
    const { allocationId } = await params

    if (!allocationId) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          message: 'Missing required parameter: allocationId'
        },
        { status: 400 }
      )
    }

    // Call service layer
    const allocation = await getAllocationById(allocationId)

    if (!allocation) {
      return NextResponse.json(
        { 
          error: 'Not found',
          message: `Allocation with ID ${allocationId} not found`
        },
        { status: 404 }
      )
    }

    return NextResponse.json(allocation)
  } catch (error) {
    console.error('Error getting allocation:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get allocation',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
