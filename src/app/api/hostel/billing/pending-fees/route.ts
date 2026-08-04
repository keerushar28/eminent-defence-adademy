import { NextRequest, NextResponse } from 'next/server'
import { getAllPendingFees } from '@/features/admin/hostel/actions/billing-actions'

export const dynamic = 'force-dynamic'

/**
 * GET /api/hostel/billing/pending-fees
 * Retrieve all pending fees using BillingService
 * Include deallocated allocations with pending fees
 * 
 * Query Parameters:
 * - includeInactive: boolean (default: true) - Include deallocated allocations
 * 
 * Requirements: 7.2, 7.4, 7.8, 9.1
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Parse includeInactive parameter (defaults to true)
    const includeInactiveParam = searchParams.get('includeInactive')
    const includeInactive = includeInactiveParam === null ? true : includeInactiveParam === 'true'

    // Call service layer
    const pendingFees = await getAllPendingFees({
      includeInactive,
    })

    return NextResponse.json({
      success: true,
      data: pendingFees,
      count: pendingFees.length,
    })
  } catch (error) {
    console.error('Error retrieving pending fees:', error)
    return NextResponse.json(
      { 
        error: 'Failed to retrieve pending fees',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
