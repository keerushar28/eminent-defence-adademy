"use server";

import { prisma } from "@/features/core/lib/prisma";

export async function getAllCategoryAssignments() {
  try {
    const assignments = await prisma.studentCategory.findMany({
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

    // Convert Decimal fields to numbers for client components
    return assignments.map(assignment => ({
      ...assignment,
      discountAmount: assignment.discountAmount.toNumber(),
      finalFee: assignment.finalFee.toNumber(),
      totalPaid: assignment.totalPaid.toNumber(),
      subCategory: assignment.subCategory ? {
        ...assignment.subCategory,
        fee: assignment.subCategory.fee.toNumber(),
      } : undefined,
      payments: assignment.payments.map(payment => ({
        ...payment,
        amount: payment.amount.toNumber(),
      })),
    }));
  } catch (error) {
    console.error("Error fetching all category assignments:", error);
    throw new Error("Failed to fetch category assignments");
  }
}

export async function getAssignmentsByCategory(categoryId: string) {
  try {
    const assignments = await prisma.studentCategory.findMany({
      where: {
        subCategory: {
          categoryId,
        },
      },
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

    // Convert Decimal fields to numbers for client components
    return assignments.map(assignment => ({
      ...assignment,
      discountAmount: assignment.discountAmount.toNumber(),
      finalFee: assignment.finalFee.toNumber(),
      totalPaid: assignment.totalPaid.toNumber(),
      subCategory: assignment.subCategory ? {
        ...assignment.subCategory,
        fee: assignment.subCategory.fee.toNumber(),
      } : undefined,
      payments: assignment.payments.map(payment => ({
        ...payment,
        amount: payment.amount.toNumber(),
      })),
    }));
  } catch (error) {
    console.error("Error fetching category assignments:", error);
    throw new Error("Failed to fetch category assignments");
  }
}

