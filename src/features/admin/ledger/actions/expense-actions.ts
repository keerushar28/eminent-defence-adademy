"use server";

import { prisma } from "@/features/core/lib/prisma";
import { ExpenseEntry, DateRangeFilter } from "../types/expense";
import { startOfMonth, endOfMonth } from "date-fns";

function getDateRange(filter: DateRangeFilter): { startDate: Date; endDate: Date } | null {
  const now = new Date();

  switch (filter.type) {
    case "ALL":
      // Return null to indicate no date filtering should be applied
      return null;
    case "CUSTOM": {
      // The client sends UTC-normalized dates (midnight UTC for the selected calendar
      // day). Clamp to the full UTC day so no entries within the selected day are
      // missed due to a time-component mismatch.
      const start = filter.startDate || startOfMonth(now);
      const end   = filter.endDate   || endOfMonth(now);
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

export async function getExpenseEntries(
  dateRange: DateRangeFilter,
  categoryId?: string,
  searchQuery?: string,
  page: number = 1,
  limit: number = 20
) {
  const dateFilter = getDateRange(dateRange);
  const skip = (page - 1) * limit;

  try {
    // Fetch inventory bills
    const bills = await prisma.inventoryBill.findMany({
      where: {
        ...(dateFilter && {
          billDate: {
            gte: dateFilter.startDate,
            lte: dateFilter.endDate,
          },
        }),
        ...(categoryId && { categoryId }),
      },
      include: {
        category: true,
      },
    });

    // Fetch accepted (RECEIVED) inventory orders
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
      include: {
        vendor: true,
        items: {
          include: {
            item: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    // Transform bills to expense entries
    const billEntries: ExpenseEntry[] = bills.map((bill) => ({
      id: bill.id,
      categoryName: bill.category.name,
      billingTitle: bill.billingTitle,
      amount: Number(bill.amount),
      billDate: bill.billDate,
      periodStartDate: bill.periodStartDate,
      periodEndDate: bill.periodEndDate,
      description: bill.description || undefined,
      createdAt: bill.createdAt,
      type: "BILL",
      items: "-",
    }));

    // Transform orders to expense entries
    const orderEntries: ExpenseEntry[] = orders.map((order) => {
      // Get unique category names from order items
      const categoryNames = [...new Set(order.items.map(item => item.item.category.name))];
      const categoryName = categoryNames.length === 1
        ? categoryNames[0]
        : categoryNames.length > 1
          ? "Mixed Categories"
          : "Uncategorized";

      const itemsList = order.items.map(item => `${item.item.name} (${item.quantity})`).join(", ");

      return {
        id: order.id,
        categoryName: categoryName,
        amount: Number(order.totalAmount),
        billDate: order.receivedAt || order.orderDate,
        periodStartDate: order.orderDate,
        periodEndDate: order.receivedAt || order.orderDate,
        description: `Order #${order.orderNumber}${order.notes ? ` - ${order.notes}` : ""}`,
        createdAt: order.createdAt,
        type: "ORDER",
        items: itemsList,
        vendorName: order.vendor.name,
      };
    });

    // Combine all entries
    const entries: ExpenseEntry[] = [...billEntries, ...orderEntries];

    // Apply search filter
    let filtered = entries;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = entries.filter(
        (entry) =>
          entry.categoryName.toLowerCase().includes(query) ||
          entry.description?.toLowerCase().includes(query) ||
          entry.billingTitle?.toLowerCase().includes(query)
      );
    }

    // Sort by date descending
    filtered.sort((a, b) => b.billDate.getTime() - a.billDate.getTime());

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
    console.error("Error fetching expense entries:", error);
    throw error;
  }
}

export async function getExpenseSummary(
  dateRange: DateRangeFilter,
  categoryId?: string
) {
  const dateFilter = getDateRange(dateRange);

  try {
    // Fetch bills
    const bills = await prisma.inventoryBill.findMany({
      where: {
        ...(dateFilter && {
          billDate: {
            gte: dateFilter.startDate,
            lte: dateFilter.endDate,
          },
        }),
        ...(categoryId && { categoryId }),
      },
      include: {
        category: true,
      },
    });

    // Fetch accepted orders
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
      include: {
        vendor: true,
        items: {
          include: {
            item: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    // Calculate totals
    const billsTotal = bills.reduce((sum, bill) => sum + Number(bill.amount), 0);
    const ordersTotal = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
    const totalExpense = billsTotal + ordersTotal;

    // Category breakdown
    const categoryBreakdown: Record<string, number> = {};

    bills.forEach((bill) => {
      const catName = bill.category.name;
      categoryBreakdown[catName] = (categoryBreakdown[catName] || 0) + Number(bill.amount);
    });

    orders.forEach((order) => {
      // Get unique category names from order items
      const categoryNames = [...new Set(order.items.map(item => item.item.category.name))];

      // If order has items from multiple categories, distribute the amount proportionally
      if (categoryNames.length === 1) {
        const catName = categoryNames[0];
        categoryBreakdown[catName] = (categoryBreakdown[catName] || 0) + Number(order.totalAmount);
      } else if (categoryNames.length > 1) {
        // For mixed categories, add to "Mixed Categories"
        categoryBreakdown["Mixed Categories"] = (categoryBreakdown["Mixed Categories"] || 0) + Number(order.totalAmount);
      } else {
        categoryBreakdown["Uncategorized"] = (categoryBreakdown["Uncategorized"] || 0) + Number(order.totalAmount);
      }
    });

    return {
      totalExpense,
      categoryBreakdown,
    };
  } catch (error) {
    console.error("Error fetching expense summary:", error);
    throw error;
  }
}

export async function getExpenseCategories() {
  try {
    const categories = await prisma.inventoryCategory.findMany({
      where: {
        isBilling: true,
      },
      orderBy: { name: "asc" },
    });
    return categories.map((cat) => ({ id: cat.id, name: cat.name }));
  } catch (error) {
    console.error("Error fetching expense categories:", error);
    return [];
  }
}