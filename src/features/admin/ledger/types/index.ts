export type PaymentSource = "STUDENT_CATEGORY" | "HOSTEL" | "INVENTORY_ISSUANCE";
export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "CHEQUE" | "ONLINE" | "CARD";

export interface LedgerEntry {
  id: string;
  source: PaymentSource;
  paymentMethod: PaymentMethod;
  amount: number;
  paymentDate: Date;
  paidBy: string;
  paidByEmail?: string;
  category?: string;
  subCategory?: string;
  description: string;
  referenceNumber?: string;
  notes?: string;
  createdAt: Date;
}

export interface LedgerSummary {
  totalIncome: number;
  totalPending: number;
  paymentMethodBreakdown: Record<PaymentMethod, number>;
  sourceBreakdown: Record<PaymentSource, number>;
  categoryBreakdown: Record<string, number>;
}

export interface DateRangeFilter {
  type: "ALL" | "CUSTOM" | "LAST_MONTH" | "LAST_QUARTER" | "LAST_YEAR" | "THIS_MONTH" | "THIS_YEAR";
  startDate?: Date;
  endDate?: Date;
}
