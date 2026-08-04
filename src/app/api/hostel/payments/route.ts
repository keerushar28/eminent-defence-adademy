import { NextRequest, NextResponse } from 'next/server'
import { createPayment } from '@/features/admin/hostel/actions/payment-actions'
import { CreatePaymentInput } from '@/features/admin/hostel/types/hostel.types'

export const dynamic = 'force-dynamic'

/**
 * POST /api/hostel/payments
 * Create a new hostel payment
 * 
 * Request Body:
 * - allocationId: string (required)
 * - amount: number (required)
 * - paymentDate: string (required, ISO date)
 * - paymentMethod: string (required)
 * - referenceNumber: string (optional)
 * - notes: string (optional)
 * - createdBy: string (required)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.allocationId || !body.amount || !body.paymentDate || !body.paymentMethod || !body.createdBy) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          message: 'Missing required fields: allocationId, amount, paymentDate, paymentMethod, createdBy'
        },
        { status: 400 }
      )
    }

    // Prepare input data
    const input: CreatePaymentInput = {
      allocationId: body.allocationId,
      amount: parseFloat(body.amount),
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

    // Handle allocation not found
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { 
          error: 'Allocation not found',
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
