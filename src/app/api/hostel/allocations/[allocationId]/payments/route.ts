import { NextRequest, NextResponse } from 'next/server'
import { createPayment, getPaymentHistory } from '@/features/admin/hostel/actions/payment-actions'
import { CreatePaymentInput } from '@/features/admin/hostel/types/hostel.types'

export const dynamic = 'force-dynamic'

/**
 * POST /api/hostel/allocations/:allocationId/payments
 * Create a new payment for an allocation
 * 
 * Path Parameters:
 * - allocationId: string (required)
 * 
 * Request Body:
 * - amount: number (required)
 * - paymentDate: string (ISO date, required)
 * - paymentMethod: string (required)
 * - referenceNumber: string (optional)
 * - notes: string (optional)
 * - createdBy: string (required)
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 9.1
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ allocationId: string }> }
) {
  try {
    const { allocationId } = await params
    const body = await request.json()

    // Validate required fields
    if (!allocationId) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          message: 'Missing required parameter: allocationId'
        },
        { status: 400 }
      )
    }

    if (!body.amount || !body.paymentDate || !body.paymentMethod || !body.createdBy) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          message: 'Missing required fields: amount, paymentDate, paymentMethod, createdBy'
        },
        { status: 400 }
      )
    }

    // Prepare input data
    const input: CreatePaymentInput = {
      allocationId,
      amount: Number(body.amount),
      paymentDate: new Date(body.paymentDate),
      paymentMethod: body.paymentMethod,
      referenceNumber: body.referenceNumber,
      notes: body.notes,
      createdBy: body.createdBy,
    }

    // Call service layer
    const payment = await createPayment(input)

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error('Error creating payment:', error)
    
    // Handle validation errors
    if (error instanceof Error && error.message.includes('Validation failed')) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          message: error.message
        },
        { status: 400 }
      )
    }

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

    return NextResponse.json(
      { 
        error: 'Failed to create payment',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/hostel/allocations/:allocationId/payments
 * Retrieve payment history for an allocation
 * 
 * Path Parameters:
 * - allocationId: string (required)
 * 
 * Requirements: 5.5, 5.7, 9.1
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
    const payments = await getPaymentHistory(allocationId)

    return NextResponse.json(payments)
  } catch (error) {
    console.error('Error getting payment history:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get payment history',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
