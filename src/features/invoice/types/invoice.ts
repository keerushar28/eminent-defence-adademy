export interface InvoiceOptions {
  includeCategoryPayments: boolean
  includeInventoryIssuances: boolean
  includeHostelPayments: boolean
  includeAllocationsInfo: boolean
}

export interface CategoryPaymentDetail {
  amount: number
  paymentDate: Date | string
  paymentMethod: string
  referenceNumber?: string
}

export interface CategoryPaymentItem {
  id: string
  studentName: string
  categoryName: string
  subCategoryName: string
  assignedDate: Date | string
  fee: number
  discount: number
  finalFee: number
  totalPaid: number
  pendingFees: number
  isActive: boolean
  payments: CategoryPaymentDetail[]
}

export interface IssuancePaymentDetail {
  amount: number
  paymentDate: Date | string
  paymentMethod: string
  referenceNumber?: string
}

export interface InventoryIssuanceItem {
  id: string
  studentName: string
  itemName: string
  quantity: number
  unitPrice: number
  totalAmount: number
  totalPaid: number
  balanceDue: number
  issuedDate: Date | string
  payments: IssuancePaymentDetail[]
}

export interface HostelPaymentDetail {
  amount: number
  daysPurchased: number
  paymentDate: Date | string
  paymentMethod: string
  referenceNumber?: string
}

export interface HostelPaymentItem {
  id: string
  studentName: string
  roomNumber: string
  bedNumber: string
  allocationDate: Date | string
  deallocationDate?: Date | string
  paidUntil: Date | string
  pricePerDay: number
  totalPaid: number
  pending: number
  credit: number
  creditBalance: number
  isActive: boolean
  payments: HostelPaymentDetail[]
}

export interface InvoiceTotals {
  categoryFinalFee: number
  categoryTotalPaid: number
  categoryPending: number
  issuanceTotalAmount: number
  issuanceTotalPaid: number
  issuancePending: number
  hostelTotalPaid: number
  hostelPending: number
  hostelCredit: number
  grandTotalPaid: number
  grandTotalPending: number
}

export interface StudentInvoiceData {
  studentId: string
  studentName: string
  email: string
  contactNumber: string
  invoiceDate: Date | string
  categoryPayments: CategoryPaymentItem[]
  inventoryIssuances: InventoryIssuanceItem[]
  hostelPayments: HostelPaymentItem[]
  totals: InvoiceTotals
}
