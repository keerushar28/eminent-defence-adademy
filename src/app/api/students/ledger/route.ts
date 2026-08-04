import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/features/core/lib/prisma";

export const dynamic = "force-dynamic";

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
    const category = searchParams.get("category") || "ALL";
    const subCategory = searchParams.get("subCategory") || "ALL";
    const paymentMethod = searchParams.get("paymentMethod") || "ALL";

    // Build where clause
    const whereClause: Record<string, unknown> = {};

    // Search filter
    if (search) {
      whereClause.OR = [
        { fullname: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Category filter
    if (category !== "ALL" || subCategory !== "ALL") {
      whereClause.studentCategories = {
        some: {
          // Include ALL allocations (active and inactive) for correct totals
          ...(category !== "ALL" && {
            subCategory: {
              category: {
                name: category,
              },
            },
          }),
          ...(subCategory !== "ALL" && {
            subCategory: {
              name: subCategory,
            },
          }),
        },
      };
    }

    // Get total count for pagination
    const totalCount = await prisma.student.count({
      where: whereClause,
    });

    // Fetch students with pagination
    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        studentCategories: {
          // Include ALL allocations (active and inactive) for correct totals
          include: {
            subCategory: {
              include: {
                category: true,
              },
            },
            payments: {
              orderBy: {
                paymentDate: "desc",
              },
              take: 5, // Only get last 5 payments per category
            },
          },
        },
      },
      orderBy: {
        fullname: "asc",
      },
      skip,
      take: limit,
    });

    // Transform data
    const ledgerStudents = students.map((student) => {
      const totalFee = student.studentCategories.reduce(
        (sum, sc) => sum + sc.finalFee.toNumber(),
        0
      );
      const totalPaid = student.studentCategories.reduce(
        (sum, sc) => sum + sc.totalPaid.toNumber(),
        0
      );
      const totalDiscount = student.studentCategories.reduce(
        (sum, sc) => sum + sc.discountAmount.toNumber(),
        0
      );
      const pendingAmount = totalFee - totalPaid;

      // Get last payment date
      const allPayments = student.studentCategories.flatMap((sc) => sc.payments);
      const lastPaymentDate =
        allPayments.length > 0
          ? allPayments.reduce((latest, payment) =>
              payment.paymentDate > latest ? payment.paymentDate : latest,
              allPayments[0].paymentDate
            )
          : null;

      // Determine status
      let calculatedStatus: "FULLY_PAID" | "UNPAID" | "PENDING" | "NO_ALLOCATION";
      
      // If no categories allocated or total fee is 0
      if (student.studentCategories.length === 0 || totalFee === 0) {
        calculatedStatus = "NO_ALLOCATION";
      } else if (pendingAmount <= 0) {
        // Fully paid
        calculatedStatus = "FULLY_PAID";
      } else if (totalPaid === 0) {
        // No payment made yet - UNPAID
        calculatedStatus = "UNPAID";
      } else {
        // Partial payment made - PENDING
        calculatedStatus = "PENDING";
      }

      // Map categories
      const categories = student.studentCategories.map((sc) => ({
        categoryName: sc.subCategory.category.name,
        subCategoryName: sc.subCategory.name,
        fee: sc.finalFee.toNumber(),
        paid: sc.totalPaid.toNumber(),
        discount: sc.discountAmount.toNumber(),
        pending: sc.finalFee.toNumber() - sc.totalPaid.toNumber(),
        assignedDate: sc.assignedDate,
        durationMonths: sc.durationMonths,
        isActive: sc.isActive,
        checkedOutAt: sc.checkedOutAt,
      }));

      // Map payments
      const payments = allPayments.map((payment) => {
        const studentCategory = student.studentCategories.find(
          (sc) => sc.id === payment.studentCategoryId
        );
        return {
          id: payment.id,
          amount: payment.amount.toNumber(),
          paymentDate: payment.paymentDate,
          paymentMethod: payment.paymentMethod,
          referenceNumber: payment.referenceNumber,
          notes: payment.notes,
          categoryName: studentCategory?.subCategory.category.name || "",
          subCategoryName: studentCategory?.subCategory.name || "",
        };
      });

      return {
        id: student.id,
        fullname: student.fullname,
        email: student.email,
        student_image: student.student_image,
        totalFee,
        totalPaid,
        totalDiscount,
        pendingAmount,
        lastPaymentDate,
        status: calculatedStatus,
        categories,
        payments,
      };
    });

    // Apply status filter after transformation (since it's calculated)
    const filteredStudents =
      status !== "ALL"
        ? ledgerStudents.filter((s) => s.status === status)
        : ledgerStudents;

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
    console.error("Error fetching ledger data:", error);
    return NextResponse.json(
      { error: "Failed to fetch ledger data" },
      { status: 500 }
    );
  }
}
