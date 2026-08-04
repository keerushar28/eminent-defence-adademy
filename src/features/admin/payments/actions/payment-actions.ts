"use server";

import { prisma } from "@/features/core/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { getCurrentUser } from "../lib/auth-utils";

interface GetPaymentsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  subCategory?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export async function getPaymentsPaginated(params: GetPaymentsParams = {}) {
  try {
    const {
      page = 1,
      pageSize = 10,
      search = "",
      category = "all",
      subCategory = "all",
      dateFrom,
      dateTo,
      sortBy = "paymentDate",
      sortOrder = "desc",
    } = params;

    const skip = (page - 1) * pageSize;

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
        // Sub Category filter
        subCategory !== "all"
          ? {
              studentCategory: {
                subCategory: {
                  name: subCategory,
                },
              },
            }
          : {},
        // Date range filter
        dateFrom || dateTo
          ? {
              paymentDate: {
                ...(dateFrom && { gte: new Date(dateFrom) }),
                ...(dateTo && { lte: new Date(new Date(dateTo).setHours(23, 59, 59, 999)) }),
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

    return {
      payments: formattedPayments,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: page,
      pageSize,
    };
  } catch (error) {
    console.error("Error fetching payments:", error);
    throw new Error("Failed to fetch payments");
  }
}

export async function getAllPayments() {
  try {
    const payments = await prisma.categoryPayment.findMany({
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
      orderBy: {
        paymentDate: "desc",
      },
    });

    // Convert Decimal fields to numbers for client components
    return payments.map(payment => ({
      ...payment,
      amount: payment.amount.toNumber(),
      studentCategory: {
        ...payment.studentCategory,
        discountAmount: payment.studentCategory.discountAmount.toNumber(),
        finalFee: payment.studentCategory.finalFee.toNumber(),
        totalPaid: payment.studentCategory.totalPaid.toNumber(),
        subCategory: payment.studentCategory.subCategory ? {
          ...payment.studentCategory.subCategory,
          fee: payment.studentCategory.subCategory.fee.toNumber(),
        } : undefined,
      },
    }));
  } catch (error) {
    console.error("Error fetching payments:", error);
    throw new Error("Failed to fetch payments");
  }
}

export async function getPaymentCategories() {
  try {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return categories;
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw new Error("Failed to fetch categories");
  }
}

export async function getPaymentSubCategories() {
  try {
    const subCategories = await prisma.subCategory.findMany({
      select: {
        id: true,
        name: true,
        categoryId: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return subCategories;
  } catch (error) {
    console.error("Error fetching sub categories:", error);
    throw new Error("Failed to fetch sub categories");
  }
}

export async function getStudentPendingFees(studentId: string, includeInactive: boolean = false) {
  try {
    const assignments = await prisma.studentCategory.findMany({
      where: {
        studentId,
        ...(includeInactive ? {} : { isActive: true }),
      },
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
        },
      },
      orderBy: {
        assignedAt: "desc",
      },
    });

    // Filter only assignments with pending balance
    const pendingAssignments = assignments
      .map(assignment => {
        const finalFee = assignment.finalFee.toNumber();
        const totalPaid = assignment.totalPaid.toNumber();
        const remaining = finalFee - totalPaid;

        return {
          ...assignment,
          discountAmount: assignment.discountAmount.toNumber(),
          finalFee,
          totalPaid,
          remaining,
          subCategory: assignment.subCategory ? {
            ...assignment.subCategory,
            fee: assignment.subCategory.fee.toNumber(),
          } : undefined,
          payments: assignment.payments.map(p => ({
            ...p,
            amount: p.amount.toNumber(),
          })),
        };
      })
      .filter(assignment => assignment.remaining > 0);

    return pendingAssignments;
  } catch (error) {
    console.error("Error fetching pending fees:", error);
    throw new Error("Failed to fetch pending fees");
  }
}

export async function addPayment(
  studentCategoryId: string,
  amount: number,
  paymentDate: string,
  paymentMethod: string,
  referenceNumber: string | null,
  notes: string | null
) {
  try {
    const currentUser = await getCurrentUser();

    // Verify the assignment exists and has pending balance
    const studentCategory = await prisma.studentCategory.findUnique({
      where: { id: studentCategoryId },
      include: {
        payments: true,
      },
    });

    if (!studentCategory) {
      return { success: false, error: "Category assignment not found" };
    }

    const finalFee = studentCategory.finalFee.toNumber();
    const totalPaid = studentCategory.totalPaid.toNumber();
    const remaining = finalFee - totalPaid;

    if (amount > remaining) {
      return {
        success: false,
        error: `Payment amount exceeds remaining balance (NPR ${remaining.toLocaleString()})`,
      };
    }

    // Parse YYYY-MM-DD safely and store as AD date (date-only)
    const parsedPaymentDate = new Date(paymentDate);
    if (isNaN(parsedPaymentDate.getTime())) {
      return { success: false, error: "Invalid payment date" };
    }

    // Create payment record
    await prisma.categoryPayment.create({
      data: {
        studentCategoryId,
        amount,
        paymentDate: parsedPaymentDate,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        paymentMethod: paymentMethod as any,
        referenceNumber,
        notes,
        createdBy: currentUser.id,
      },
    });

    // Update total paid in student category
    const newTotalPaid = totalPaid + amount;

    await prisma.studentCategory.update({
      where: { id: studentCategoryId },
      data: {
        totalPaid: newTotalPaid,
      },
    });

    revalidatePath("/admin/categories/payments");
    revalidatePath("/admin/ledger/students");
    return { success: true };
  } catch (error) {
    console.error("Error adding payment:", error);
    return { success: false, error: "Failed to add payment" };
  }
}


export async function deletePayment(paymentId: string) {
  try {
    const currentUser = await getCurrentUser();

    // Check if user is admin
    if (currentUser.role !== "ADMIN" && currentUser.role !== "SUPER_ADMIN") {
      return { success: false, error: "Only admins can delete payments" };
    }

    // Get the payment to find the student category
    const payment = await prisma.categoryPayment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      return { success: false, error: "Payment not found" };
    }

    const studentCategoryId = payment.studentCategoryId;
    const paymentAmount = payment.amount.toNumber();

    // Delete the payment
    await prisma.categoryPayment.delete({
      where: { id: paymentId },
    });

    // Update total paid in student category (subtract the payment amount)
    const studentCategory = await prisma.studentCategory.findUnique({
      where: { id: studentCategoryId },
    });

    if (studentCategory) {
      const newTotalPaid = Math.max(0, studentCategory.totalPaid.toNumber() - paymentAmount);
      await prisma.studentCategory.update({
        where: { id: studentCategoryId },
        data: {
          totalPaid: newTotalPaid,
        },
      });
    }

    revalidatePath("/admin/categories/payments");
    return { success: true };
  } catch (error) {
    console.error("Error deleting payment:", error);
    return { success: false, error: "Failed to delete payment" };
  }
}


export async function updatePayment(
  paymentId: string,
  amount: number,
  paymentDate: string,
  paymentMethod: string,
  referenceNumber: string | null,
  notes: string | null
) {
  try {
    const currentUser = await getCurrentUser();

    // Check if user is admin
    if (currentUser.role !== "ADMIN" && currentUser.role !== "SUPER_ADMIN") {
      return { success: false, error: "Only admins can edit payments" };
    }

    // Get the existing payment
    const existingPayment = await prisma.categoryPayment.findUnique({
      where: { id: paymentId },
      include: {
        studentCategory: true,
      },
    });

    if (!existingPayment) {
      return { success: false, error: "Payment not found" };
    }

    const studentCategory = existingPayment.studentCategory;
    const oldAmount = existingPayment.amount.toNumber();
    const amountDifference = amount - oldAmount;

    // Verify the new amount doesn't exceed remaining balance
    const finalFee = studentCategory.finalFee.toNumber();
    const totalPaid = studentCategory.totalPaid.toNumber();
    const currentRemaining = finalFee - totalPaid;
    const newRemaining = currentRemaining - amountDifference;

    if (newRemaining < 0) {
      return {
        success: false,
        error: `New payment amount would exceed remaining balance (NPR ${currentRemaining.toLocaleString()})`,
      };
    }

    // Parse payment date
    const parsedPaymentDate = new Date(paymentDate);
    if (isNaN(parsedPaymentDate.getTime())) {
      return { success: false, error: "Invalid payment date" };
    }

    // Update the payment
    await prisma.categoryPayment.update({
      where: { id: paymentId },
      data: {
        amount,
        paymentDate: parsedPaymentDate,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        paymentMethod: paymentMethod as any,
        referenceNumber,
        notes,
      },
    });

    // Update total paid in student category
    const newTotalPaid = totalPaid + amountDifference;

    await prisma.studentCategory.update({
      where: { id: studentCategory.id },
      data: {
        totalPaid: newTotalPaid,
      },
    });

    revalidatePath("/admin/categories/payments");
    return { success: true };
  } catch (error) {
    console.error("Error updating payment:", error);
    return { success: false, error: "Failed to update payment" };
  }
}
