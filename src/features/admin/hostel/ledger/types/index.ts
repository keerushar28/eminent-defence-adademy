export interface HostelLedgerStudent {
  id: string;
  fullname: string;
  email: string;
  student_image: string;
  contactNumber: string;
  roomNumber: string;
  bedNumber: string;
  pricePerDay: number;
  allocationDate: Date;
  paidUntil: Date;
  totalDays: number;
  daysPaid: number;
  totalFee: number;
  totalPaid: number;
  pendingAmount: number;
  overpaidAmount: number;
  lastPaymentDate: Date | null;
  status: "FULLY_PAID" | "PARTIAL" | "PENDING" | "OVERPAID";
  payments: {
    id: string;
    amount: number;
    paymentDate: Date;
    paymentMethod: string;
    referenceNumber: string | null;
    daysPurchased: number;
    updatedPaidUntil: Date;
    notes: string | null;
  }[];
  allocationId: string;
}

export interface HostelLedgerSummary {
  totalStudents: number;
  fullyPaid: number;
  partial: number;
  pending: number;
  overpaid: number;
  totalFeesCollected: number;
  totalPendingFees: number;
  totalOverpaidAmount: number;
}
