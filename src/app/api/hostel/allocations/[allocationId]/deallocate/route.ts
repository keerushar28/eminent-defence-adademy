import { NextRequest, NextResponse } from 'next/server'
import { deallocateStudent } from '@/features/admin/hostel/actions/allocation-actions'

export const dynamic = 'force-dynamic'

/**
 * POST /api/hostel/allocations/:allocationId/deallocate
 * Deallocate a student from their bed
 * Returns warning if pending fees exist
 * 
 * Path Parameters:
 * - allocationId: string (required)
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 9.1
 */
export async function POST(
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
    const result = await deallocateStudent(allocationId)

    // Return allocation with warning if pending fees exist
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error deallocating student:', error)
    
    // Handle not found errors
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { 
          error: 'Not found',
          message: error.message
        },
        { status: 404 }
      )
    }

    // Handle business logic errors (already deallocated)
    if (error instanceof Error && error.message.includes('already deallocated')) {
      return NextResponse.json(
        { 
          error: 'Business logic error',
          message: error.message
        },
        { status: 422 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Failed to deallocate student',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
