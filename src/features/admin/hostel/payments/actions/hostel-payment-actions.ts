'use server'

import { PrismaClient, Prisma } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/features/core/lib/auth'

const prisma = new PrismaClient()

interface GetHostelPaymentsParams {
  page?: number
  pageSize?: number
  search?: string
  dateFrom?: string
  dateTo?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export async function getHostelPaymentsPaginated(params: GetHostelPaymentsParams) {
  const {
    page = 1,
    pageSize = 10,
    search = '',
    dateFrom,
    dateTo,
    sortBy = 'paymentDate',
    sortOrder = 'desc',
  } = params

  try {
    const skip = (page - 1) * pageSize

    // Build where clause
    const where: Prisma.HostelPaymentWhereInput = {
      AND: [
        // Search filter
        search
          ? {
              OR: [
                {
                  allocation: {
                    student: {
                      fullname: {
                        contains: search,
                        mode: 'insensitive',
                      },
                    },
                  },
                },
                {
                  allocation: {
                    student: {
                      email: {
                        contains: search,
                        mode: 'insensitive',
                      },
                    },
                  },
                },
                {
                  allocation: {
                    bed: {
                      room: {
                        roomNumber: {
                          contains: search,
                          mode: 'insensitive',
                        },
                      },
                    },
                  },
                },
              ],
            }
          : {},
        // Date range filter
        dateFrom || dateTo
          ? {
              paymentDate: {
                ...(dateFrom && { gte: new Date(dateFrom) }),
                ...(dateTo && { lte: new Date(dateTo) }),
              },
            }
          : {},
      ],
    }

    // Build orderBy clause
    let orderBy: Prisma.HostelPaymentOrderByWithRelationInput = {}

    if (sortBy === 'studentName') {
      orderBy = {
        allocation: {
          student: {
            fullname: sortOrder,
          },
        },
      }
    } else if (sortBy === 'roomNumber') {
      orderBy = {
        allocation: {
          bed: {
            room: {
              roomNumber: sortOrder,
            },
          },
        },
      }
    } else {
      orderBy = { [sortBy]: sortOrder }
    }

    // Execute queries in parallel
    const [payments, totalCount] = await Promise.all([
      prisma.hostelPayment.findMany({
        where,
        include: {
          allocation: {
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
            },
          },
        },
        orderBy,
        skip,
        take: pageSize,
      }),
      prisma.hostelPayment.count({ where }),
    ])

    const totalPages = Math.ceil(totalCount / pageSize)

    // Convert Decimal to number for client
    const paymentsWithNumbers = payments.map((payment) => ({
      ...payment,
      amount: Number(payment.amount),
      allocation: {
        ...payment.allocation,
        bed: {
          ...payment.allocation.bed,
          pricePerDay: Number(payment.allocation.bed.pricePerDay),
        },
      },
    }))

    return {
      payments: paymentsWithNumbers,
      totalCount,
      totalPages,
      currentPage: page,
    }
  } catch (error) {
    console.error('Error fetching hostel payments:', error)
    throw new Error('Failed to fetch hostel payments')
  }
}


export async function updateHostelPayment(
  paymentId: string,
  amount: number,
  paymentMethod: string,
  referenceNumber: string | null,
  notes: string | null
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Only ADMIN and SUPER_ADMIN can update payments
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Only admins can update payments' }
    }

    // Verify payment exists and get old amount
    const existingPayment = await prisma.hostelPayment.findUnique({
      where: { id: paymentId },
      include: {
        allocation: {
          include: {
            bed: true,
          },
        },
      },
    })

    if (!existingPayment) {
      return { success: false, error: 'Payment not found' }
    }

    const oldAmount = Number(existingPayment.amount)
    const pricePerDay = Number(existingPayment.allocation.bed.pricePerDay)
    const oldDaysPurchased = existingPayment.daysPurchased
    const oldPaidUntil = new Date(existingPayment.updatedPaidUntil)

    // Calculate new days purchased
    const newDaysPurchased = Math.floor(amount / pricePerDay)

    // Calculate the difference in days
    const daysDifference = newDaysPurchased - oldDaysPurchased

    // Calculate new paid until date
    const newPaidUntil = new Date(oldPaidUntil)
    newPaidUntil.setDate(newPaidUntil.getDate() + daysDifference)

    // Update payment and allocation in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the payment
      const updatedPayment = await tx.hostelPayment.update({
        where: { id: paymentId },
        data: {
          amount,
          daysPurchased: newDaysPurchased,
          updatedPaidUntil: newPaidUntil,
          paymentMethod,
          referenceNumber,
          notes,
        },
        include: {
          allocation: {
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
            },
          },
        },
      })

      // Update allocation's paidUntil date
      await tx.hostelAllocation.update({
        where: { id: existingPayment.allocationId },
        data: {
          paidUntil: newPaidUntil,
        },
      })

      return updatedPayment
    })

    return {
      success: true,
      payment: {
        ...result,
        amount: Number(result.amount),
        allocation: {
          ...result.allocation,
          bed: {
            ...result.allocation.bed,
            pricePerDay: Number(result.allocation.bed.pricePerDay),
          },
        },
      },
    }
  } catch (error) {
    console.error('Error updating hostel payment:', error)
    return { success: false, error: 'Failed to update payment' }
  }
}

export async function deleteHostelPayment(paymentId: string) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Only ADMIN and SUPER_ADMIN can delete payments
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Only admins can delete payments' }
    }

    // Verify payment exists
    const existingPayment = await prisma.hostelPayment.findUnique({
      where: { id: paymentId },
    })

    if (!existingPayment) {
      return { success: false, error: 'Payment not found' }
    }

    // Delete the payment
    await prisma.hostelPayment.delete({
      where: { id: paymentId },
    })

    return { success: true }
  } catch (error) {
    console.error('Error deleting hostel payment:', error)
    return { success: false, error: 'Failed to delete payment' }
  }
}
