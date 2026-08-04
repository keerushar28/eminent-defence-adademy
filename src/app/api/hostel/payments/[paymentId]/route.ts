import { NextRequest, NextResponse } from 'next/server'
import { getPaymentById } from '@/features/admin/hostel/actions/payment-actions'

export const dynamic = 'force-dynamic'

/**
 * GET /api/hostel/payments/:paymentId
 * Retrieve a single payment by ID
 * 
 * Path Parameters:
 * - paymentId: string (required)
 * 
 * Requirements: 5.7, 9.1
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await params

    if (!paymentId) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          message: 'Missing required parameter: paymentId'
        },
        { status: 400 }
      )
    }

    // Call service layer
    const payment = await getPaymentById(paymentId)

    if (!payment) {
      return NextResponse.json(
        { 
          error: 'Not found',
          message: `Payment with ID ${paymentId} not found`
        },
        { status: 404 }
      )
    }

    return NextResponse.json(payment)
  } catch (error) {
    console.error('Error getting payment:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get payment',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
