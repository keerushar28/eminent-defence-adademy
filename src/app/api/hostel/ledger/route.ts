import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/features/core/lib/prisma";
import { Prisma } from "@prisma/client";
import { calculateTotalPayableDays } from "@/features/admin/hostel/lib/calculations";

export const dynamic = "force-dynamic";

type PaymentStatus = "FULLY_PAID" | "PARTIAL" | "PENDING" | "OVERPAID";

interface WhereClause {
  hostelAllocations: {
    some: {
      isActive?: boolean;
      bed?: {
        room: {
          roomNumber: string;
        };
      };
    };
  };
  OR?: Array<{
    fullname?: { contains: string; mode: Prisma.QueryMode };
    email?: { contains: string; mode: Prisma.QueryMode };
  }>;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Filters
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "ALL";
    const roomNumber = searchParams.get("roomNumber") || "ALL";
    const category = searchParams.get("category") || "ALL";
    const subcategory = searchParams.get("subcategory") || "ALL";
    const paymentMethod = searchParams.get("paymentMethod") || "ALL";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build where clause for students - show all students with any allocation
    const whereClause: WhereClause = {
      hostelAllocations: {
        some: {},
      },
    };

    // Search filter
    if (search) {
      whereClause.OR = [
        { fullname: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Room filter
    if (roomNumber !== "ALL") {
      whereClause.hostelAllocations = {
        some: {
          bed: {
            room: {
              roomNumber: roomNumber,
            },
          },
        },
      };
    }

    // Category filter
    if (category !== "ALL") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (whereClause as any).studentCategories = {
        some: {
          subCategory: {
            categoryId: category,
          },
        },
      };
    }

    // Subcategory filter
    if (subcategory !== "ALL") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (whereClause as any).studentCategories = {
        some: {
          subCategoryId: subcategory,
        },
      };
    }

    // Get total count for pagination
    const totalCount = await prisma.student.count({
      where: whereClause,
    });

    // Fetch students with hostel allocations
    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        hostelAllocations: {
          include: {
            bed: {
              include: {
                room: true,
              },
            },
            payments: {
              orderBy: {
                paymentDate: "desc",
              },
            },
          },
          orderBy: {
            allocationDate: "desc",
          },
          take: 1, // Most recent allocation
        },
      },
      orderBy: {
        fullname: "asc",
      },
      skip,
      take: limit,
    });

    // Transform data
    const hostelLedgerStudents = students
      .map((student) => {
        const allocation = student.hostelAllocations[0]; // Active allocation

        if (!allocation) {
          return null;
        }

        const pricePerDay = allocation.bed.pricePerDay.toNumber();
        const allocationDate = allocation.allocationDate;
        const paidUntil = allocation.paidUntil;
        // Use deallocation date for inactive allocations, today for active
        const today = !allocation.isActive && allocation.deallocationDate
          ? new Date(allocation.deallocationDate)
          : new Date();

        // Calculate days consumed using the same logic as AddHostelPaymentDialog
        const daysConsumed = calculateTotalPayableDays(allocationDate, today);

        // Calculate amount consumed
        const amountConsumed = daysConsumed * pricePerDay;

        // Calculate total paid
        const totalPaid = allocation.payments.reduce(
          (sum, payment) => sum + payment.amount.toNumber(),
          0
        );

        // Calculate days paid
        const daysPaid = Math.floor(totalPaid / pricePerDay);

        // Calculate balance (positive = overpaid, negative = pending)
        const balance = totalPaid - amountConsumed;

        // Calculate pending and overpaid amounts
        const pendingAmount = balance < 0 ? Math.abs(balance) : 0;
        const overpaidAmount = balance > 0 ? balance : 0;

        // Determine status based on actual balance
        let calculatedStatus: PaymentStatus;
        if (overpaidAmount > 0) {
          calculatedStatus = "OVERPAID";
        } else if (pendingAmount === 0) {
          // No pending fees and not overpaid = fully paid
          calculatedStatus = "FULLY_PAID";
        } else if (totalPaid > 0) {
          // Has paid something but still has pending fees
          calculatedStatus = "PARTIAL";
        } else {
          // Has not paid anything
          calculatedStatus = "PENDING";
        }

        // Get last payment date
        const lastPaymentDate =
          allocation.payments.length > 0
            ? allocation.payments[0].paymentDate
            : null;

        // Map payments with date range filter
        let payments = allocation.payments.map((payment) => ({
          id: payment.id,
          amount: payment.amount.toNumber(),
          paymentDate: payment.paymentDate,
          paymentMethod: payment.paymentMethod,
          referenceNumber: payment.referenceNumber,
          daysPurchased: payment.daysPurchased,
          updatedPaidUntil: payment.updatedPaidUntil,
          notes: payment.notes,
        }));

        // Apply date range filter to payments
        if (startDate) {
          const start = new Date(startDate);
          payments = payments.filter((p) => new Date(p.paymentDate) >= start);
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          payments = payments.filter((p) => new Date(p.paymentDate) <= end);
        }

        return {
          id: student.id,
          fullname: student.fullname,
          email: student.email,
          student_image: student.student_image,
          contactNumber: student.contact_number_student,
          roomNumber: allocation.bed.room.roomNumber,
          bedNumber: allocation.bed.bedNumber,
          pricePerDay,
          allocationDate,
          paidUntil,
          totalDays: daysConsumed,
          daysPaid,
          totalFee: amountConsumed,
          totalPaid,
          pendingAmount,
          overpaidAmount,
          lastPaymentDate,
          status: calculatedStatus,
          payments,
          allocationId: allocation.id,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    // Apply status filter after transformation
    const filteredStudents =
      status !== "ALL"
        ? hostelLedgerStudents.filter((s) => s.status === status)
        : hostelLedgerStudents;

    // Apply payment method filter
    const finalStudents =
      paymentMethod !== "ALL"
        ? filteredStudents.filter((s) =>
            s.payments.some((p) => p.paymentMethod === paymentMethod)
          )
        : filteredStudents;

    return NextResponse.json({
      students: finalStudents,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching hostel ledger data:", error);
    return NextResponse.json(
      { error: "Failed to fetch hostel ledger data" },
      { status: 500 }
    );
  }
}
