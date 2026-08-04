import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/features/core/lib/prisma'
import { getToken } from 'next-auth/jwt'

export const dynamic = 'force-dynamic'

/**
 * POST /api/super-admin/clear-database
 * Clears all database data except User records
 * Only accessible by SUPER_ADMIN role
 */
export async function POST(request: NextRequest) {
  try {
    // Verify user is SUPER_ADMIN
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    if (!token || token.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Only SUPER_ADMIN can perform this action.' },
        { status: 403 }
      )
    }

    // Get confirmation from request body
    const body = await request.json()
    if (body.confirm !== true) {
      return NextResponse.json(
        { error: 'Confirmation required. Set confirm: true in request body.' },
        { status: 400 }
      )
    }

    // Delete all data in order of dependencies (respecting foreign keys)
    // Start with the most dependent tables and work backwards

    // 1. Delete all payments and transactions
    await prisma.hostelPayment.deleteMany({})
    await prisma.categoryPayment.deleteMany({})
    await prisma.issuancePayment.deleteMany({})
    await prisma.vendorPayment.deleteMany({})

    // 2. Delete ledger entries
    await prisma.ledgerEntry.deleteMany({})

    // 3. Delete settlements
    await prisma.settlement.deleteMany({})

    // 4. Delete hostel allocations (before deleting students)
    await prisma.hostelAllocation.deleteMany({})

    // 5. Delete student issuances
    await prisma.studentIssuance.deleteMany({})

    // 6. Delete student categories
    await prisma.studentCategory.deleteMany({})

    // 7. Delete subcategory selections
    await prisma.subCategorySelection.deleteMany({})

    // 8. Delete students
    await prisma.student.deleteMany({})

    // 9. Delete inventory related data
    await prisma.stockTransaction.deleteMany({})
    await prisma.orderItem.deleteMany({})
    await prisma.order.deleteMany({})
    await prisma.vendorItem.deleteMany({})
    await prisma.inventoryBill.deleteMany({})
    await prisma.inventoryItem.deleteMany({})

    // 10. Delete vendors
    await prisma.vendor.deleteMany({})

    // 11. Delete hostel beds and rooms
    await prisma.hostelBed.deleteMany({})
    await prisma.hostelRoom.deleteMany({})

    // 12. Delete subcategories and categories
    await prisma.subCategory.deleteMany({})
    await prisma.category.deleteMany({})

    // 13. Delete inventory categories
    await prisma.inventoryCategory.deleteMany({})

    return NextResponse.json(
      {
        success: true,
        message: 'Database cleared successfully. All data except users has been deleted.',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error clearing database:', error)
    return NextResponse.json(
      {
        error: 'Failed to clear database',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
