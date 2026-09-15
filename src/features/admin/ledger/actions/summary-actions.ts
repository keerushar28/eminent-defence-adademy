"use server";

import { prisma } from "@/features/core/lib/prisma";
import { DateRangeFilter } from "../types/expense";
import { startOfMonth, endOfMonth } from "date-fns";

function getDateRange(filter: DateRangeFilter): { startDate: Date; endDate: Date } | null {
  const now = new Date();

  switch (filter.type) {
    case "ALL":
      return null;
    case "CUSTOM": {
      const start = filter.startDate || startOfMonth(now);
      const end = filter.endDate || endOfMonth(now);
      return {
        startDate: new Date(
          Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate(), 0, 0, 0, 0)
        ),
        endDate: new Date(
          Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate(), 23, 59, 59, 999)
        ),
      };
    }
    default:
      return null;
  }
}

export async function getOverallSummary(dateRange: DateRangeFilter) {
  const dateFilter = getDateRange(dateRange);

  try {
    // 1. Category-wise payments (from StudentCategory payments)
    const categoryPayments = await prisma.categoryPayment.findMany({
      where: {
        ...(dateFilter && {
          paymentDate: {
            gte: dateFilter.startDate,
            lte: dateFilter.endDate,
          },
        }),
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

    // Group by category and subcategory for hierarchical structure
    const categoryHierarchy: Record<string, { total: number; subCategories: Record<string, number> }> = {};
    categoryPayments.forEach((payment) => {
      const categoryName = payment.studentCategory.subCategory.category.name;
      const subCategoryName = payment.studentCategory.subCategory.name;
      const amount = Number(payment.amount);

      if (!categoryHierarchy[categoryName]) {
        categoryHierarchy[categoryName] = { total: 0, subCategories: {} };
      }

      categoryHierarchy[categoryName].total += amount;
      categoryHierarchy[categoryName].subCategories[subCategoryName] = 
        (categoryHierarchy[categoryName].subCategories[subCategoryName] || 0) + amount;
    });

    // Keep the old flat structure for backward compatibility
    const categoryBreakdown: Record<string, number> = {};
    Object.entries(categoryHierarchy).forEach(([categoryName, data]) => {
      categoryBreakdown[categoryName] = data.total;
    });

    // 2. Expenditure (Bills + Orders)
    const bills = await prisma.inventoryBill.findMany({
      where: {
        ...(dateFilter && {
          billDate: {
            gte: dateFilter.startDate,
            lte: dateFilter.endDate,
          },
        }),
      },
      include: {
        category: true,
      },
    });

    const orders = await prisma.order.findMany({
      where: {
        status: "RECEIVED",
        ...(dateFilter && {
          receivedAt: {
            gte: dateFilter.startDate,
            lte: dateFilter.endDate,
          },
        }),
      },
    });

    const expenditureBreakdown: Record<string, number> = {};
    bills.forEach((bill) => {
      const categoryName = bill.category.name;
      expenditureBreakdown[categoryName] = (expenditureBreakdown[categoryName] || 0) + Number(bill.amount);
    });

    orders.forEach((order) => {
      expenditureBreakdown["Inventory Orders"] = (expenditureBreakdown["Inventory Orders"] || 0) + Number(order.totalAmount);
    });

    // 3. Hostel payments
    const hostelPayments = await prisma.hostelPayment.findMany({
      where: {
        ...(dateFilter && {
          paymentDate: {
            gte: dateFilter.startDate,
            lte: dateFilter.endDate,
          },
        }),
      },
      include: {
        allocation: {
          include: {
            student: {
              include: {
                studentCategories: {
                  where: { isActive: true },
                  include: {
                    subCategory: {
                      include: {
                        category: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Group hostel payments by student's category and subcategory
    const hostelHierarchy: Record<string, { total: number; subCategories: Record<string, number> }> = {};
    hostelPayments.forEach((payment) => {
      const studentCategories = payment.allocation.student.studentCategories;
      const amount = Number(payment.amount);
      
      if (studentCategories.length > 0) {
        // Use the first active category
        const categoryName = studentCategories[0].subCategory.category.name;
        const subCategoryName = studentCategories[0].subCategory.name;
        
        if (!hostelHierarchy[categoryName]) {
          hostelHierarchy[categoryName] = { total: 0, subCategories: {} };
        }

        hostelHierarchy[categoryName].total += amount;
        hostelHierarchy[categoryName].subCategories[subCategoryName] = 
          (hostelHierarchy[categoryName].subCategories[subCategoryName] || 0) + amount;
      } else {
        if (!hostelHierarchy["Uncategorized"]) {
          hostelHierarchy["Uncategorized"] = { total: 0, subCategories: {} };
        }
        hostelHierarchy["Uncategorized"].total += amount;
        hostelHierarchy["Uncategorized"].subCategories["No Subcategory"] = 
          (hostelHierarchy["Uncategorized"].subCategories["No Subcategory"] || 0) + amount;
      }
    });

    // Keep the old flat structure for backward compatibility
    const hostelByCategory: Record<string, number> = {};
    Object.entries(hostelHierarchy).forEach(([categoryName, data]) => {
      hostelByCategory[categoryName] = data.total;
    });

    // 4. Issuance payments
    const issuancePayments = await prisma.issuancePayment.findMany({
      where: {
        ...(dateFilter && {
          paymentDate: {
            gte: dateFilter.startDate,
            lte: dateFilter.endDate,
          },
        }),
      },
    });

    const totalIssuancePayments = issuancePayments.reduce((sum, payment) => sum + Number(payment.amount), 0);

    // 5. Extra / manual income entries from the ledger
    const extraIncomeEntries = await prisma.ledgerEntry.findMany({
      where: {
        type: "INCOME",
        category: "EXTRA_INCOME",
        ...(dateFilter && {
          recordedDate: {
            gte: dateFilter.startDate,
            lte: dateFilter.endDate,
          },
        }),
      },
    });

    const totalExtraIncome = extraIncomeEntries.reduce((sum, entry) => sum + Number(entry.amount), 0);

    // Calculate totals
    const totalCategoryReceive = Object.values(categoryBreakdown).reduce((sum, val) => sum + val, 0);
    const totalExpenditure = Object.values(expenditureBreakdown).reduce((sum, val) => sum + val, 0);
    const totalHostelReceive = Object.values(hostelByCategory).reduce((sum, val) => sum + val, 0);
    const totalReceive = totalCategoryReceive + totalHostelReceive + totalIssuancePayments + totalExtraIncome;
    const remainingBalance = totalReceive - totalExpenditure;

    return {
      categoryBreakdown: Object.entries(categoryBreakdown)
        .filter(([_, amount]) => amount > 0)
        .map(([name, amount]) => ({ name, amount })),
      categoryHierarchy: Object.entries(categoryHierarchy)
        .filter(([_, data]) => data.total > 0)
        .map(([name, data]) => ({
          name,
          amount: data.total,
          subCategories: Object.entries(data.subCategories)
            .filter(([_, amount]) => amount > 0)
            .map(([subName, subAmount]) => ({ name: subName, amount: subAmount }))
        })),
      expenditureBreakdown: Object.entries(expenditureBreakdown)
        .filter(([_, amount]) => amount > 0)
        .map(([name, amount]) => ({ name, amount })),
      hostelByCategory: Object.entries(hostelByCategory)
        .filter(([_, amount]) => amount > 0)
        .map(([name, amount]) => ({ name, amount })),
      hostelHierarchy: Object.entries(hostelHierarchy)
        .filter(([_, data]) => data.total > 0)
        .map(([name, data]) => ({
          name,
          amount: data.total,
          subCategories: Object.entries(data.subCategories)
            .filter(([_, amount]) => amount > 0)
            .map(([subName, subAmount]) => ({ name: subName, amount: subAmount }))
        })),
      totals: {
        totalCategoryReceive,
        totalExpenditure,
        totalHostelReceive,
        totalIssuancePayments,
        totalExtraIncome,
        totalReceive,
        remainingBalance,
      },
    };
  } catch (error) {
    console.error("Error fetching overall summary:", error);
    throw error;
  }
}
