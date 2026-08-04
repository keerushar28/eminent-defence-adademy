"use server";

import { prisma } from "@/features/core/lib/prisma";

export interface LedgerStudent {
  id: string;
  fullname: string;
  email: string;
  student_image: string;
  totalFee: number;
  totalPaid: number;
  totalDiscount: number;
  pendingAmount: number;
  lastPaymentDate: Date | null;
  status: "FULLY_PAID" | "UNPAID" | "PENDING" | "NO_ALLOCATION";
  categories: {
    categoryName: string;
    subCategoryName: string;
    fee: number;
    paid: number;
    discount: number;
    pending: number;
    assignedDate: Date;
    durationMonths: number | null;
    isActive: boolean;
    checkedOutAt: Date | null;
  }[];
  payments: {
    id: string;
    amount: number;
    paymentDate: Date;
    paymentMethod: string;
    referenceNumber: string | null;
    notes: string | null;
    categoryName: string;
    subCategoryName: string;
  }[];
}

export interface LedgerSummary {
  totalStudents: number;
  fullyPaid: number;
  pending: number;
  unpaid: number;
  noAllocation: number;
  totalFeesCollected: number;
  totalPendingFees: number;
}

export async function getLedgerCategories() {
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

export async function getLedgerSubCategories() {
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

export async function getLedgerPaymentMethods() {
  try {
    const paymentMethods = await prisma.categoryPayment.findMany({
      select: {
        paymentMethod: true,
      },
      distinct: ["paymentMethod"],
      orderBy: {
        paymentMethod: "asc",
      },
    });

    return paymentMethods.map((p) => p.paymentMethod);
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    throw new Error("Failed to fetch payment methods");
  }
}

export async function getLedgerData(): Promise<{
  students: LedgerStudent[];
  summary: LedgerSummary;
}> {
  try {
    const students = await prisma.student.findMany({
      include: {
        studentCategories: {
          // Include ALL allocations (both active and inactive) to show complete history
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
        },
      },
      orderBy: {
        fullname: "asc",
      },
    });

    const ledgerStudents: LedgerStudent[] = students.map((student) => {
      // Aggregate across ALL allocations (active and inactive)
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

      // Get last payment date across all categories
      const allPayments = student.studentCategories.flatMap(
        (sc) => sc.payments
      );
      const lastPaymentDate =
        allPayments.length > 0
          ? allPayments.reduce((latest, payment) =>
              payment.paymentDate > latest ? payment.paymentDate : latest
            , allPayments[0].paymentDate)
          : null;

      // Determine status
      let status: "FULLY_PAID" | "UNPAID" | "PENDING" | "NO_ALLOCATION";
      
      // If no categories allocated or total fee is 0
      if (student.studentCategories.length === 0 || totalFee === 0) {
        status = "NO_ALLOCATION";
      } else if (pendingAmount <= 0) {
        // Fully paid
        status = "FULLY_PAID";
      } else if (totalPaid === 0) {
        // No payment made yet - UNPAID
        status = "UNPAID";
      } else {
        // Partial payment made - PENDING
        status = "PENDING";
      }

      // Map categories (show all allocations with their status)
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
        status,
        categories,
        payments,
      };
    });

    // Calculate summary
    const summary: LedgerSummary = {
      totalStudents: ledgerStudents.length,
      fullyPaid: ledgerStudents.filter((s) => s.status === "FULLY_PAID").length,
      pending: ledgerStudents.filter((s) => s.status === "PENDING").length,
      unpaid: ledgerStudents.filter((s) => s.status === "UNPAID").length,
      noAllocation: ledgerStudents.filter((s) => s.status === "NO_ALLOCATION").length,
      totalFeesCollected: ledgerStudents.reduce(
        (sum, s) => sum + s.totalPaid,
        0
      ),
      totalPendingFees: ledgerStudents.reduce(
        (sum, s) => sum + s.pendingAmount,
        0
      ),
    };

    return { students: ledgerStudents, summary };
  } catch (error) {
    console.error("Error fetching ledger data:", error);
    throw new Error("Failed to fetch ledger data");
  }
}
