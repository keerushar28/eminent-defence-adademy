import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/features/core/lib/prisma";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const skip = (page - 1) * pageSize;

    // Filters
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "all";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    // Sorting
    const sortBy = searchParams.get("sortBy") || "paymentDate";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

    // Build where clause
    const where: Prisma.CategoryPaymentWhereInput = {
      AND: [
        // Search filter
        search
          ? {
              OR: [
                {
                  studentCategory: {
                    student: {
                      fullname: {
                        contains: search,
                        mode: "insensitive",
                      },
                    },
                  },
                },
                {
                  studentCategory: {
                    student: {
                      email: {
                        contains: search,
                        mode: "insensitive",
                      },
                    },
                  },
                },
                {
                  studentCategory: {
                    subCategory: {
                      name: {
                        contains: search,
                        mode: "insensitive",
                      },
                    },
                  },
                },
                {
                  studentCategory: {
                    subCategory: {
                      category: {
                        name: {
                          contains: search,
                          mode: "insensitive",
                        },
                      },
                    },
                  },
                },
              ],
            }
          : {},
        // Category filter
        category !== "all"
          ? {
              studentCategory: {
                subCategory: {
                  category: {
                    name: category,
                  },
                },
              },
            }
          : {},
        // Date range filter
        dateFrom || dateTo
          ? {
              paymentDate: {
                ...(dateFrom && { gte: new Date(dateFrom) }),
                ...(dateTo && {
                  lte: new Date(new Date(dateTo).setHours(23, 59, 59, 999)),
                }),
              },
            }
          : {},
      ],
    };

    // Build orderBy clause
    let orderBy: Prisma.CategoryPaymentOrderByWithRelationInput = {};

    if (sortBy === "studentName") {
      orderBy = {
        studentCategory: {
          student: {
            fullname: sortOrder,
          },
        },
      };
    } else if (sortBy === "amount") {
      orderBy = { amount: sortOrder };
    } else {
      orderBy = { paymentDate: sortOrder };
    }

    // Execute queries in parallel
    const [payments, totalCount] = await Promise.all([
      prisma.categoryPayment.findMany({
        where,
        include: {
          studentCategory: {
            include: {
              student: {
                select: {
                  id: true,
                  fullname: true,
                  email: true,
                  contact_number_student: true,
                },
              },
              subCategory: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
        orderBy,
        skip,
        take: pageSize,
      }),
      prisma.categoryPayment.count({ where }),
    ]);

    // Convert Decimal fields to numbers for client components
    const formattedPayments = payments.map((payment) => ({
      ...payment,
      amount: payment.amount.toNumber(),
      studentCategory: {
        ...payment.studentCategory,
        discountAmount: payment.studentCategory.discountAmount.toNumber(),
        finalFee: payment.studentCategory.finalFee.toNumber(),
        totalPaid: payment.studentCategory.totalPaid.toNumber(),
        subCategory: payment.studentCategory.subCategory
          ? {
              ...payment.studentCategory.subCategory,
              fee: payment.studentCategory.subCategory.fee.toNumber(),
            }
          : undefined,
      },
    }));

    return NextResponse.json({
      payments: formattedPayments,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: page,
      pageSize,
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}
