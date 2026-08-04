export interface ExpenseEntry {
  id: string;
  categoryName: string;
  billingTitle?: string;
  amount: number;
  billDate: Date;
  periodStartDate: Date;
  periodEndDate: Date;
  description?: string;
  createdAt: Date;
  type?: "BILL" | "ORDER";
  items?: string; // Comma-separated list of items
  vendorName?: string; // For orders
}

export interface ExpenseSummary {
  totalExpense: number;
  categoryBreakdown: Record<string, number>;
}

export interface DateRangeFilter {
  type: "CUSTOM" | "ALL";
  startDate?: Date;
  endDate?: Date;
}
