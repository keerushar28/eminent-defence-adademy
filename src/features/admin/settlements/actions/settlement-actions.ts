"use server";

import { prisma } from "@/features/core/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { getCurrentUser } from "../lib/auth-utils";
import type { 
  SettlementStats, 
  PaymentWithDetails, 
  GetPaymentsParams, 
  CreateSettlementParams,
  Settlement 
} from "../types";

export async function getSettlementStats(): Promise<SettlementStats> {
  try {
    // Get all payments across all types
    const [categoryPayments, hostelPayments, issuancePayments] = await Promise.all([
      prisma.categoryPayment.aggregate({
        _sum: { amount: true },
        _count: true,
      }),
      prisma.hostelPayment.aggregate({
        _sum: { amount: true },
        _count: true,
      }),
      prisma.issuancePayment.aggregate({
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    // Get settled payments
    const [settledCategoryPayments, settledHostelPayments, settledIssuancePayments] = await Promise.all([
      prisma.categoryPayment.aggregate({
        where: { settlementId: { not: null } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.hostelPayment.aggregate({
        where: { settlementId: { not: null } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.issuancePayment.aggregate({
        where: { settlementId: { not: null } },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const totalCollected = 
      (categoryPayments._sum.amount?.toNumber() || 0) +
      (hostelPayments._sum.amount?.toNumber() || 0) +
      (issuancePayments._sum.amount?.toNumber() || 0);

    const totalSettled = 
      (settledCategoryPayments._sum.amount?.toNumber() || 0) +
      (settledHostelPayments._sum.amount?.toNumber() || 0) +
      (settledIssuancePayments._sum.amount?.toNumber() || 0);

    const totalPayments = 
      (categoryPayments._count || 0) +
      (hostelPayments._count || 0) +
      (issuancePayments._count || 0);

    return {
      totalCollected,
      totalSettled,
      remainingSettlement: totalCollected - totalSettled,
      totalPayments,
    };
  } catch (error) {
    console.error("Error fetching settlement stats:", error);
    throw new Error("Failed to fetch settlement statistics");
  }
}

export async function getAllPaymentsPaginated(params: GetPaymentsParams = {}) {
  try {
    const {
      page = 1,
      pageSize = 10,
      search = "",
      type = "ALL",
      isSettled,
      dateFrom,
      dateTo,
      sortBy = "paymentDate",
      sortOrder = "desc",
      createdBy,
      approvedBy,
    } = params;

    const skip = (page - 1) * pageSize;
    const payments: PaymentWithDetails[] = [];

    // Build date filter
    const dateFilter = dateFrom || dateTo ? {
      paymentDate: {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo && { lte: new Date(new Date(dateTo).setHours(23, 59, 59, 999)) }),
      },
    } : {};

    // Build settlement filter
    const settlementFilter = isSettled !== undefined ? {
      settlementId: isSettled ? { not: null } : null,
    } : {};

    // Fetch category payments
    if (type === "ALL" || type === "CATEGORY") {
      const categoryWhere: Prisma.CategoryPaymentWhereInput = {
        ...dateFilter,
        ...settlementFilter,
        ...(search && {
          OR: [
            { studentCategory: { student: { fullname: { contains: search, mode: "insensitive" } } } },
            { studentCategory: { student: { email: { contains: search, mode: "insensitive" } } } },
            { studentCategory: { subCategory: { name: { contains: search, mode: "insensitive" } } } },
            { studentCategory: { subCategory: { category: { name: { contains: search, mode: "insensitive" } } } } },
          ],
        }),
      };

      const categoryPayments = await prisma.categoryPayment.findMany({
        where: categoryWhere,
        include: {
          studentCategory: {
            include: {
              student: {
                select: { id: true, fullname: true, email: true },
              },
              subCategory: {
                include: { category: true },
              },
            },
          },
        },
        orderBy: sortBy === "amount" ? { amount: sortOrder } : { paymentDate: sortOrder },
      });

      // Fetch user information for createdBy fields
      const userIds = [...new Set(categoryPayments.map(p => p.createdBy))];
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, username: true, email: true, role: true },
      });
      const userMap = new Map(users.map(u => [u.id, u]));

      // Fetch settlement information and approval users
      const settlementIds = [...new Set(categoryPayments.map(p => p.settlementId).filter(Boolean))];
      const settlements = await prisma.settlement.findMany({
        where: { id: { in: settlementIds as string[] } },
        select: { id: true, recordedBy: true },
      });
      const approvalUserIds = [...new Set(settlements.map(s => s.recordedBy))];
      const approvalUsers = await prisma.user.findMany({
        where: { id: { in: approvalUserIds } },
        select: { id: true, username: true, email: true, role: true },
      });
      const approvalUserMap = new Map(approvalUsers.map(u => [u.id, u]));
      const settlementMap = new Map(settlements.map(s => [s.id, s]));

      payments.push(...categoryPayments.map(p => {
        const createdByUser = userMap.get(p.createdBy);
        const settlement = p.settlementId ? settlementMap.get(p.settlementId) : null;
        const approvedByUser = settlement ? approvalUserMap.get(settlement.recordedBy) : null;

        return {
          id: p.id,
          amount: p.amount.toNumber(),
          paymentDate: p.paymentDate,
          paymentMethod: p.paymentMethod,
          referenceNumber: p.referenceNumber,
          notes: p.notes,
          createdBy: p.createdBy,
          createdByUser,
          settlementId: p.settlementId,
          isSettled: !!p.settlementId,
          approvedBy: approvedByUser,
          type: "CATEGORY" as const,
          studentCategory: {
            id: p.studentCategory.id,
            student: p.studentCategory.student,
            subCategory: {
              id: p.studentCategory.subCategory.id,
              name: p.studentCategory.subCategory.name,
              category: p.studentCategory.subCategory.category,
            },
          },
        };
      }));
    }

    // Fetch hostel payments
    if (type === "ALL" || type === "HOSTEL") {
      const hostelWhere: Prisma.HostelPaymentWhereInput = {
        ...dateFilter,
        ...settlementFilter,
        ...(search && {
          OR: [
            { allocation: { student: { fullname: { contains: search, mode: "insensitive" } } } },
            { allocation: { student: { email: { contains: search, mode: "insensitive" } } } },
            { allocation: { bed: { bedNumber: { contains: search, mode: "insensitive" } } } },
            { allocation: { bed: { room: { roomNumber: { contains: search, mode: "insensitive" } } } } },
          ],
        }),
      };

      const hostelPayments = await prisma.hostelPayment.findMany({
        where: hostelWhere,
        include: {
          allocation: {
            include: {
              student: {
                select: { id: true, fullname: true, email: true },
              },
              bed: {
                include: { room: true },
              },
            },
          },
        },
        orderBy: sortBy === "amount" ? { amount: sortOrder } : { paymentDate: sortOrder },
      });

      // Fetch user information for hostel payments
      const hostelUserIds = [...new Set(hostelPayments.map(p => p.createdBy))];
      const hostelUsers = await prisma.user.findMany({
        where: { id: { in: hostelUserIds } },
        select: { id: true, username: true, email: true, role: true },
      });
      const hostelUserMap = new Map(hostelUsers.map(u => [u.id, u]));

      // Fetch settlement information for hostel payments
      const hostelSettlementIds = [...new Set(hostelPayments.map(p => p.settlementId).filter(Boolean))];
      const hostelSettlements = await prisma.settlement.findMany({
        where: { id: { in: hostelSettlementIds as string[] } },
        select: { id: true, recordedBy: true },
      });
      const hostelApprovalUserIds = [...new Set(hostelSettlements.map(s => s.recordedBy))];
      const hostelApprovalUsers = await prisma.user.findMany({
        where: { id: { in: hostelApprovalUserIds } },
        select: { id: true, username: true, email: true, role: true },
      });
      const hostelApprovalUserMap = new Map(hostelApprovalUsers.map(u => [u.id, u]));
      const hostelSettlementMap = new Map(hostelSettlements.map(s => [s.id, s]));

      payments.push(...hostelPayments.map(p => {
        const createdByUser = hostelUserMap.get(p.createdBy);
        const settlement = p.settlementId ? hostelSettlementMap.get(p.settlementId) : null;
        const approvedByUser = settlement ? hostelApprovalUserMap.get(settlement.recordedBy) : null;

        return {
          id: p.id,
          amount: p.amount.toNumber(),
          paymentDate: p.paymentDate,
          paymentMethod: p.paymentMethod,
          referenceNumber: p.referenceNumber,
          notes: p.notes,
          createdBy: p.createdBy,
          createdByUser,
          settlementId: p.settlementId,
          isSettled: !!p.settlementId,
          approvedBy: approvedByUser,
          type: "HOSTEL" as const,
          hostelAllocation: {
            id: p.allocation.id,
            student: p.allocation.student,
            bed: {
              id: p.allocation.bed.id,
              bedNumber: p.allocation.bed.bedNumber,
              room: {
                id: p.allocation.bed.room.id,
                roomNumber: p.allocation.bed.room.roomNumber,
              },
            },
          },
        };
      }));
    }

    // Fetch issuance payments
    if (type === "ALL" || type === "ISSUANCE") {
      const issuanceWhere: Prisma.IssuancePaymentWhereInput = {
        ...dateFilter,
        ...settlementFilter,
        ...(search && {
          OR: [
            { issuance: { student: { fullname: { contains: search, mode: "insensitive" } } } },
            { issuance: { student: { email: { contains: search, mode: "insensitive" } } } },
            { issuance: { item: { name: { contains: search, mode: "insensitive" } } } },
            { issuance: { item: { category: { name: { contains: search, mode: "insensitive" } } } } },
          ],
        }),
      };

      const issuancePayments = await prisma.issuancePayment.findMany({
        where: issuanceWhere,
        include: {
          issuance: {
            include: {
              student: {
                select: { id: true, fullname: true, email: true },
              },
              item: {
                include: { category: true },
              },
            },
          },
        },
        orderBy: sortBy === "amount" ? { amount: sortOrder } : { paymentDate: sortOrder },
      });

      // Fetch user information for issuance payments
      const issuanceUserIds = [...new Set(issuancePayments.map(p => p.createdBy))];
      const issuanceUsers = await prisma.user.findMany({
        where: { id: { in: issuanceUserIds } },
        select: { id: true, username: true, email: true, role: true },
      });
      const issuanceUserMap = new Map(issuanceUsers.map(u => [u.id, u]));

      // Fetch settlement information for issuance payments
      const issuanceSettlementIds = [...new Set(issuancePayments.map(p => p.settlementId).filter(Boolean))];
      const issuanceSettlements = await prisma.settlement.findMany({
        where: { id: { in: issuanceSettlementIds as string[] } },
        select: { id: true, recordedBy: true },
      });
      const issuanceApprovalUserIds = [...new Set(issuanceSettlements.map(s => s.recordedBy))];
      const issuanceApprovalUsers = await prisma.user.findMany({
        where: { id: { in: issuanceApprovalUserIds } },
        select: { id: true, username: true, email: true, role: true },
      });
      const issuanceApprovalUserMap = new Map(issuanceApprovalUsers.map(u => [u.id, u]));
      const issuanceSettlementMap = new Map(issuanceSettlements.map(s => [s.id, s]));

      payments.push(...issuancePayments.map(p => {
        const createdByUser = issuanceUserMap.get(p.createdBy);
        const settlement = p.settlementId ? issuanceSettlementMap.get(p.settlementId) : null;
        const approvedByUser = settlement ? issuanceApprovalUserMap.get(settlement.recordedBy) : null;

        return {
          id: p.id,
          amount: p.amount.toNumber(),
          paymentDate: p.paymentDate,
          paymentMethod: p.paymentMethod,
          referenceNumber: p.referenceNumber,
          notes: p.notes,
          createdBy: p.createdBy,
          createdByUser,
          settlementId: p.settlementId,
          isSettled: !!p.settlementId,
          approvedBy: approvedByUser,
          type: "ISSUANCE" as const,
          issuance: {
            id: p.issuance.id,
            student: p.issuance.student,
            item: {
              id: p.issuance.item.id,
              name: p.issuance.item.name,
              category: p.issuance.item.category,
            },
          },
        };
      }));
    }

    // Sort all payments
    payments.sort((a, b) => {
      if (sortBy === "amount") {
        return sortOrder === "asc" ? a.amount - b.amount : b.amount - a.amount;
      }
      const dateA = new Date(a.paymentDate).getTime();
      const dateB = new Date(b.paymentDate).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    // Apply pagination
    const totalCount = payments.length;
    const paginatedPayments = payments.slice(skip, skip + pageSize);

    return {
      payments: paginatedPayments,
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

export async function createSettlement(params: CreateSettlementParams) {
  try {
    const currentUser = await getCurrentUser();
    const { paymentIds, notes } = params;

    // Validate that all payments exist and are not already settled
    const [categoryPayments, hostelPayments, issuancePayments] = await Promise.all([
      prisma.categoryPayment.findMany({
        where: { id: { in: paymentIds }, settlementId: null },
        select: { id: true, amount: true, paymentMethod: true },
      }),
      prisma.hostelPayment.findMany({
        where: { id: { in: paymentIds }, settlementId: null },
        select: { id: true, amount: true, paymentMethod: true },
      }),
      prisma.issuancePayment.findMany({
        where: { id: { in: paymentIds }, settlementId: null },
        select: { id: true, amount: true, paymentMethod: true },
      }),
    ]);

    const allPayments = [...categoryPayments, ...hostelPayments, ...issuancePayments];
    const foundPaymentIds = allPayments.map(p => p.id);
    const missingPaymentIds = paymentIds.filter(id => !foundPaymentIds.includes(id));

    if (missingPaymentIds.length > 0) {
      return {
        success: false,
        error: `Some payments are already approved or don't exist: ${missingPaymentIds.join(", ")}`,
      };
    }

    // Calculate total amount
    const totalAmount = allPayments.reduce((sum, payment) => sum + payment.amount.toNumber(), 0);
    
    // Use the payment method from the first payment (since it's just approval, not new payment details)
    const paymentMethod = allPayments[0]?.paymentMethod || "CASH";

    // Create settlement in a transaction
    const settlement = await prisma.$transaction(async (tx) => {
      // Create settlement record
      const newSettlement = await tx.settlement.create({
        data: {
          amount: totalAmount,
          paymentMethod: paymentMethod as any,
          notes,
          recordedBy: currentUser.id,
        },
      });

      // Update payments with settlement ID
      const categoryPaymentIds = categoryPayments.map(p => p.id);
      const hostelPaymentIds = hostelPayments.map(p => p.id);
      const issuancePaymentIds = issuancePayments.map(p => p.id);

      await Promise.all([
        categoryPaymentIds.length > 0 && tx.categoryPayment.updateMany({
          where: { id: { in: categoryPaymentIds } },
          data: { settlementId: newSettlement.id },
        }),
        hostelPaymentIds.length > 0 && tx.hostelPayment.updateMany({
          where: { id: { in: hostelPaymentIds } },
          data: { settlementId: newSettlement.id },
        }),
        issuancePaymentIds.length > 0 && tx.issuancePayment.updateMany({
          where: { id: { in: issuancePaymentIds } },
          data: { settlementId: newSettlement.id },
        }),
      ]);

      return newSettlement;
    });

    revalidatePath("/admin/settlements");
    return { success: true, settlementId: settlement.id };
  } catch (error) {
    console.error("Error creating settlement:", error);
    return { success: false, error: "Failed to approve payments" };
  }
}

export async function getSettlements(page = 1, pageSize = 10): Promise<{
  settlements: Settlement[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}> {
  try {
    const skip = (page - 1) * pageSize;

    const [settlements, totalCount] = await Promise.all([
      prisma.settlement.findMany({
        include: {
          _count: {
            select: {
              categoryPayments: true,
              hostelPayments: true,
              issuancePayments: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.settlement.count(),
    ]);

    const formattedSettlements: Settlement[] = settlements.map(s => ({
      id: s.id,
      amount: s.amount.toNumber(),
      settlementDate: s.settlementDate,
      paymentMethod: s.paymentMethod,
      referenceNumber: s.referenceNumber,
      notes: s.notes,
      recordedBy: s.recordedBy,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      categoryPaymentsCount: s._count.categoryPayments,
      hostelPaymentsCount: s._count.hostelPayments,
      issuancePaymentsCount: s._count.issuancePayments,
    }));

    return {
      settlements: formattedSettlements,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: page,
      pageSize,
    };
  } catch (error) {
    console.error("Error fetching settlements:", error);
    throw new Error("Failed to fetch settlements");
  }
}

export async function updatePaymentSettlementStatus(
  paymentId: string,
  paymentType: 'CATEGORY' | 'HOSTEL' | 'ISSUANCE',
  isSettled: boolean,
  settlementDetails?: {
    notes?: string;
  }
) {
  try {
    const currentUser = await getCurrentUser();

    // Get the payment to validate it exists and get amount
    let payment: any = null;
    let amount = 0;

    if (paymentType === 'CATEGORY') {
      payment = await prisma.categoryPayment.findUnique({
        where: { id: paymentId },
        select: { id: true, amount: true, settlementId: true, paymentMethod: true },
      });
    } else if (paymentType === 'HOSTEL') {
      payment = await prisma.hostelPayment.findUnique({
        where: { id: paymentId },
        select: { id: true, amount: true, settlementId: true, paymentMethod: true },
      });
    } else if (paymentType === 'ISSUANCE') {
      payment = await prisma.issuancePayment.findUnique({
        where: { id: paymentId },
        select: { id: true, amount: true, settlementId: true, paymentMethod: true },
      });
    }

    if (!payment) {
      return { success: false, error: "Payment not found" };
    }

    amount = payment.amount.toNumber();

    // Check current settlement status
    const currentlySettled = !!payment.settlementId;
    
    if (currentlySettled === isSettled) {
      return { 
        success: false, 
        error: `Payment is already ${isSettled ? 'approved' : 'pending approval'}` 
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      let settlementId: string | null = null;

      if (isSettled) {
        // Create individual settlement for approval
        const settlement = await tx.settlement.create({
          data: {
            amount,
            paymentMethod: payment.paymentMethod, // Use existing payment method
            notes: settlementDetails?.notes,
            recordedBy: currentUser.id,
          },
        });
        settlementId = settlement.id;
      } else {
        // If revoking approval, handle the existing settlement
        if (payment.settlementId) {
          // Check if this settlement has other payments
          const [categoryCount, hostelCount, issuanceCount] = await Promise.all([
            tx.categoryPayment.count({ where: { settlementId: payment.settlementId } }),
            tx.hostelPayment.count({ where: { settlementId: payment.settlementId } }),
            tx.issuancePayment.count({ where: { settlementId: payment.settlementId } }),
          ]);

          const totalPaymentsInSettlement = categoryCount + hostelCount + issuanceCount;
          
          if (totalPaymentsInSettlement === 1) {
            // This is the only payment in the settlement, delete the settlement
            await tx.settlement.delete({ where: { id: payment.settlementId } });
          } else {
            // Update settlement amount by subtracting this payment
            const settlement = await tx.settlement.findUnique({
              where: { id: payment.settlementId },
              select: { amount: true },
            });
            
            if (settlement) {
              const newAmount = settlement.amount.toNumber() - amount;
              await tx.settlement.update({
                where: { id: payment.settlementId },
                data: { amount: newAmount },
              });
            }
          }
        }
      }

      // Update the payment
      if (paymentType === 'CATEGORY') {
        await tx.categoryPayment.update({
          where: { id: paymentId },
          data: { settlementId },
        });
      } else if (paymentType === 'HOSTEL') {
        await tx.hostelPayment.update({
          where: { id: paymentId },
          data: { settlementId },
        });
      } else if (paymentType === 'ISSUANCE') {
        await tx.issuancePayment.update({
          where: { id: paymentId },
          data: { settlementId },
        });
      }

      return { settlementId };
    });

    revalidatePath("/admin/settlements");
    return { 
      success: true, 
      message: `Payment ${isSettled ? 'approved' : 'approval revoked'} successfully`,
      settlementId: result.settlementId 
    };
  } catch (error) {
    console.error("Error updating payment settlement status:", error);
    return { success: false, error: "Failed to update payment approval status" };
  }
}

export async function getPaymentDetails(paymentId: string, paymentType: 'CATEGORY' | 'HOSTEL' | 'ISSUANCE') {
  try {
    let payment: any = null;

    if (paymentType === 'CATEGORY') {
      payment = await prisma.categoryPayment.findUnique({
        where: { id: paymentId },
        include: {
          settlement: true,
          studentCategory: {
            include: {
              student: { select: { id: true, fullname: true, email: true } },
              subCategory: { include: { category: true } },
            },
          },
        },
      });
    } else if (paymentType === 'HOSTEL') {
      payment = await prisma.hostelPayment.findUnique({
        where: { id: paymentId },
        include: {
          settlement: true,
          allocation: {
            include: {
              student: { select: { id: true, fullname: true, email: true } },
              bed: { include: { room: true } },
            },
          },
        },
      });
    } else if (paymentType === 'ISSUANCE') {
      payment = await prisma.issuancePayment.findUnique({
        where: { id: paymentId },
        include: {
          settlement: true,
          issuance: {
            include: {
              student: { select: { id: true, fullname: true, email: true } },
              item: { include: { category: true } },
            },
          },
        },
      });
    }

    if (!payment) {
      return { success: false, error: "Payment not found" };
    }

    return {
      success: true,
      payment: {
        ...payment,
        amount: payment.amount.toNumber(),
        settlement: payment.settlement ? {
          ...payment.settlement,
          amount: payment.settlement.amount.toNumber(),
        } : null,
      },
    };
  } catch (error) {
    console.error("Error fetching payment details:", error);
    return { success: false, error: "Failed to fetch payment details" };
  }
}