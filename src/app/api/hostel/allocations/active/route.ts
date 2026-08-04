import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

/**
 * GET /api/hostel/allocations/active
 * Get allocations with student and bed details.
 * Pass includeInactive=true to also include deallocated allocations.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const includeInactive = searchParams.get('includeInactive') === 'true'
  const q = searchParams.get('q') || ''
  const limit = parseInt(searchParams.get('limit') || '50')

  try {
    const where: Parameters<typeof prisma.hostelAllocation.findMany>[0]['where'] = {
      ...(includeInactive ? {} : { isActive: true }),
      ...(q
        ? {
            OR: [
              { student: { fullname: { contains: q, mode: 'insensitive' } } },
              { student: { email: { contains: q, mode: 'insensitive' } } },
              { bed: { room: { roomNumber: { contains: q, mode: 'insensitive' } } } },
              { bed: { bedNumber: { contains: q, mode: 'insensitive' } } },
            ],
          }
        : {}),
    }

    const allocations = await prisma.hostelAllocation.findMany({
      where,
      take: limit + 1,
      include: {
        student: {
          select: {
            id: true,
            fullname: true,
            email: true,
            contact_number_student: true,
          },
        },
        bed: {
          include: {
            room: {
              select: {
                id: true,
                roomNumber: true,
              },
            },
          },
        },
        payments: {
          select: {
            amount: true,
          },
        },
      },
      orderBy: {
        allocationDate: 'desc',
      },
    })

    const hasMore = allocations.length > limit
    const sliced = hasMore ? allocations.slice(0, limit) : allocations

    // Convert Decimal to number
    const allocationsWithNumbers = sliced.map((allocation) => ({
      ...allocation,
      bed: {
        ...allocation.bed,
        pricePerDay: allocation.bed.pricePerDay ? Number(allocation.bed.pricePerDay) : 0,
      },
      payments: allocation.payments.map((payment) => ({
        amount: payment.amount ? Number(payment.amount) : 0,
      })),
    }))

    return NextResponse.json({ allocations: allocationsWithNumbers, hasMore })
  } catch (error) {
    console.error('Error fetching active allocations:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch active allocations',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
