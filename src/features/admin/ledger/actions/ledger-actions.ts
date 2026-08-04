"use server";

import { prisma } from "@/features/core/lib/prisma";
import { LedgerEntry, LedgerSummary, DateRangeFilter, PaymentSource } from "../types";
import { startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subQuarters } from "date-fns";

function getDateRange(filter: DateRangeFilter): { startDate?: Date; endDate?: Date } {
  const now = new Date();

  switch (filter.type) {
    case "ALL":
      return {};
    case "LAST_MONTH":
      const lastMonth = subMonths(now, 1);
      return {
        startDate: startOfMonth(lastMonth),
        endDate: endOfMonth(lastMonth),
      };
    case "LAST_QUARTER":
      const lastQuarter = subQuarters(now, 1);
      return {
        startDate: startOfMonth(lastQuarter),
        endDate: endOfMonth(now),
      };
    case "LAST_YEAR":
      return {
        startDate: startOfYear(subMonths(now, 12)),
        endDate: endOfYear(subMonths(now, 12)),
      };
    case "THIS_MONTH":
      return {
        startDate: startOfMonth(now),
        endDate: endOfMonth(now),
      };
    case "THIS_YEAR":
      return {
        startDate: startOfYear(now),
        endDate: endOfYear(now),
      };
    case "CUSTOM":
      return {
        startDate: filter.startDate,
        endDate: filter.endDate,
      };
    default:
      return {};
  }
}

export async function getLedgerEntries(
  dateRange: DateRangeFilter,
  paymentMethod?: string,
  source?: PaymentSource,
  searchQuery?: string,
  category?: string,
  subCategory?: string,
  page: number = 1,
  limit: number = 20
) {
  const { startDate, endDate } = getDateRange(dateRange);
  const skip = (page - 1) * limit;
  const dateFilter = startDate && endDate ? { gte: startDate, lte: endDate } : undefined;

  try {
    // Fetch category payments
    const categoryPayments = await prisma.categoryPayment.findMany({
      where: {
        ...(dateFilter && { paymentDate: dateFilter }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(paymentMethod && { paymentMethod: paymentMethod as any }),
      },
      include: {
        studentCategory: {
          include: {
            student: true,
            subCategory: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    // Fetch hostel payments
    const hostelPayments = await prisma.hostelPayment.findMany({
      where: {
        ...(dateFilter && { paymentDate: dateFilter }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(paymentMethod && { paymentMethod: paymentMethod as any }),
      },
      include: {
        allocation: {
          include: {
            student: true,
            bed: {
              include: {
                room: true,
              },
            },
          },
        },
      },
    });

    // Fetch inventory bills (treated as expected income)
    const inventoryBills = await prisma.inventoryBill.findMany({
      where: {
        ...(dateFilter && { billDate: dateFilter }),
      },
      include: {
        category: true,
      },
    });

    // Fetch issuance payments
    const issuancePayments = await prisma.issuancePayment.findMany({
      where: {
        ...(dateFilter && { paymentDate: dateFilter }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(paymentMethod && { paymentMethod: paymentMethod as any }),
      },
      include: {
        issuance: {
          include: {
            student: true,
            item: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    // Transform to ledger entries
    const entries: LedgerEntry[] = [];

    categoryPayments.forEach((payment) => {
      if (!source || source === "STUDENT_CATEGORY") {
        const catName = payment.studentCategory.subCategory.category.name;
        const subCatName = payment.studentCategory.subCategory.name;
        
        // Apply category and sub-category filters
        if (category && catName !== category) return;
        if (subCategory && subCatName !== subCategory) return;
        
        entries.push({
          id: payment.id,
          source: "STUDENT_CATEGORY",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          paymentMethod: payment.paymentMethod as any,
          amount: Number(payment.amount),
          paymentDate: payment.paymentDate,
          paidBy: payment.studentCategory.student.fullname,
          paidByEmail: payment.studentCategory.student.email,
          category: catName,
          subCategory: subCatName,
          description: `${payment.studentCategory.student.fullname} - ${subCatName}`,
          referenceNumber: payment.referenceNumber || undefined,
          notes: payment.notes || undefined,
          createdAt: payment.createdAt,
        });
      }
    });

    hostelPayments.forEach((payment) => {
      // Skip hostel payments if category/sub-category filter is applied
      if (category || subCategory) return;
      
      if (!source || source === "HOSTEL") {
        entries.push({
          id: payment.id,
          source: "HOSTEL",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          paymentMethod: payment.paymentMethod as any,
          amount: Number(payment.amount),
          paymentDate: payment.paymentDate,
          paidBy: payment.allocation.student.fullname,
          paidByEmail: payment.allocation.student.email,
          category: `Room ${payment.allocation.bed.room.roomNumber}`,
          subCategory: `Bed ${payment.allocation.bed.bedNumber}`,
          description: `${payment.allocation.student.fullname} - Hostel (${payment.daysPurchased} days)`,
          referenceNumber: payment.referenceNumber || undefined,
          notes: payment.notes || undefined,
          createdAt: payment.createdAt,
        });
      }
    });

    issuancePayments.forEach((payment) => {
      // Skip issuance payments if category/sub-category filter is applied
      if (category || subCategory) return;
      
      if (!source || source === "INVENTORY_ISSUANCE") {
        entries.push({
          id: payment.id,
          source: "INVENTORY_ISSUANCE",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          paymentMethod: payment.paymentMethod as any,
          amount: Number(payment.amount),
          paymentDate: payment.paymentDate,
          paidBy: payment.issuance.student.fullname,
          paidByEmail: payment.issuance.student.email,
          category: payment.issuance.item.category?.name || "Inventory",
          subCategory: payment.issuance.item.name,
          description: `${payment.issuance.student.fullname} - ${payment.issuance.item.name} (${payment.issuance.quantity} ${payment.issuance.item.unit})`,
          referenceNumber: payment.referenceNumber || undefined,
          notes: payment.notes || undefined,
          createdAt: payment.createdAt,
        });
      }
    });

    // Apply search filter
    let filtered = entries;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = entries.filter(
        (entry) =>
          entry.paidBy.toLowerCase().includes(query) ||
          entry.paidByEmail?.toLowerCase().includes(query) ||
          entry.description.toLowerCase().includes(query) ||
          entry.referenceNumber?.toLowerCase().includes(query)
      );
    }

    // Sort by date descending
    filtered.sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime());

    // Paginate
    const total = filtered.length;
    const paginatedEntries = filtered.slice(skip, skip + limit);

    return {
      entries: paginatedEntries,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error("Error fetching ledger entries:", error);
    throw error;
  }
}

export async function getLedgerSummary(
  dateRange: DateRangeFilter,
  paymentMethod?: string,
  source?: PaymentSource,
  category?: string,
  subCategory?: string
) {
  const { startDate, endDate } = getDateRange(dateRange);
  const dateFilter = startDate && endDate ? { gte: startDate, lte: endDate } : undefined;

  try {
    // Get all payments with category/sub-category filters
    const categoryPayments = await prisma.categoryPayment.findMany({
      where: {
        ...(dateFilter && { paymentDate: dateFilter }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(paymentMethod && { paymentMethod: paymentMethod as any }),
        ...(category || subCategory ? {
          studentCategory: {
            subCategory: {
              ...(category && { category: { name: category } }),
              ...(subCategory && { name: subCategory }),
            },
          },
        } : {}),
      },
      include: {
        studentCategory: {
          include: {
            subCategory: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    // Only fetch hostel and issuance payments if no category/sub-category filter
    const hostelPayments = (category || subCategory) ? [] : await prisma.hostelPayment.findMany({
      where: {
        ...(dateFilter && { paymentDate: dateFilter }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(paymentMethod && { paymentMethod: paymentMethod as any }),
      },
    });

    const issuancePayments = (category || subCategory) ? [] : await prisma.issuancePayment.findMany({
      where: {
        ...(dateFilter && { paymentDate: dateFilter }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(paymentMethod && { paymentMethod: paymentMethod as any }),
      },
    });

    // Calculate totals
    const categoryIncome = categoryPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const hostelIncome = hostelPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const issuanceIncome = issuancePayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalIncome = categoryIncome + hostelIncome + issuanceIncome;

    // Calculate pending (students with unpaid categories - including deallocated)
    const unpaidCategories = await prisma.studentCategory.findMany({
      where: {
        ...(category || subCategory ? {
          subCategory: {
            ...(category && { category: { name: category } }),
            ...(subCategory && { name: subCategory }),
          },
        } : {}),
      },
      include: {
        subCategory: {
          include: {
            category: true,
          },
        },
      },
    });

    const totalPending = unpaidCategories.reduce((sum, sc) => {
      const pending = Number(sc.finalFee) - Number(sc.totalPaid);
      return sum + (pending > 0 ? pending : 0);
    }, 0);

    // Payment method breakdown
    const paymentMethodBreakdown: Record<string, number> = {};
    [...categoryPayments, ...hostelPayments, ...issuancePayments].forEach((payment) => {
      const method = payment.paymentMethod;
      paymentMethodBreakdown[method] = (paymentMethodBreakdown[method] || 0) + Number(payment.amount);
    });

    // Source breakdown
    const sourceBreakdown: Record<string, number> = {
      STUDENT_CATEGORY: categoryIncome,
      HOSTEL: hostelIncome,
      INVENTORY_ISSUANCE: issuanceIncome,
    };

    // Category breakdown
    const categoryBreakdown: Record<string, number> = {};
    categoryPayments.forEach((payment) => {
      const catName = payment.studentCategory.subCategory.category.name;
      categoryBreakdown[catName] = (categoryBreakdown[catName] || 0) + Number(payment.amount);
    });
    categoryBreakdown["Hostel"] = hostelIncome;
    categoryBreakdown["Inventory"] = issuanceIncome;

    return {
      totalIncome,
      totalPending,
      paymentMethodBreakdown,
      sourceBreakdown,
      categoryBreakdown,
    };
  } catch (error) {
    console.error("Error fetching ledger summary:", error);
    throw error;
  }
}

export async function getPaymentMethods() {
  return ["CASH", "BANK_TRANSFER", "CHEQUE", "ONLINE", "CARD"];
}

export async function getPaymentSources() {
  return ["STUDENT_CATEGORY", "HOSTEL", "INVENTORY_ISSUANCE"];
}

export async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });
    return categories.map((cat) => ({ id: cat.id, name: cat.name }));
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export async function getSubCategories(categoryId?: string) {
  try {
    const subCategories = await prisma.subCategory.findMany({
      where: categoryId ? { categoryId } : undefined,
      include: { category: true },
      orderBy: { name: "asc" },
    });
    return subCategories.map((subCat) => ({
      id: subCat.id,
      name: subCat.name,
      categoryId: subCat.categoryId,
      categoryName: subCat.category.name,
    }));
  } catch (error) {
    console.error("Error fetching sub-categories:", error);
    return [];
  }
}
