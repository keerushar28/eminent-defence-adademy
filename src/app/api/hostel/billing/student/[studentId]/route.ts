import { NextRequest, NextResponse } from 'next/server'
import { getStudentFinancialView } from '@/features/admin/hostel/actions/billing-actions'

export const dynamic = 'force-dynamic'

/**
 * GET /api/hostel/billing/student/:studentId
 * Retrieve complete financial view for a student
 * Include all allocations, payments, pending fees, and credits
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.5, 7.6, 7.7, 9.1
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params

    if (!studentId) {
      return NextResponse.json(
        { 
          error: 'Student ID is required',
          message: 'Please provide a valid student ID'
        },
        { status: 400 }
      )
    }

    // Call service layer
    const financialView = await getStudentFinancialView(studentId)

    return NextResponse.json({
      success: true,
      data: financialView,
    })
  } catch (error) {
    console.error('Error retrieving student financial view:', error)
    
    // Handle specific error cases
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { 
          error: 'Student not found',
          message: error.message
        },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Failed to retrieve student financial view',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
