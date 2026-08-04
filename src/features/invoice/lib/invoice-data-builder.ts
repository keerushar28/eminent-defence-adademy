import {
  calculatePendingAmount,
  calculatePendingDays,
  calculateOverpaidAmount,
} from "@/features/admin/hostel/lib/calculations"
import type {
  CategoryPaymentDetail,
  CategoryPaymentItem,
  HostelPaymentDetail,
  HostelPaymentItem,
  InventoryIssuanceItem,
  IssuancePaymentDetail,
  StudentInvoiceData,
  InvoiceTotals,
} from "../types/invoice"

type CategoryPaymentRecord = {
  amount: { toNumber(): number } | number | string
  paymentDate: Date | string
  paymentMethod: string
  referenceNumber?: string | null
}

type StudentCategoryRecord = {
  id: string
  assignedDate: Date | string
  finalFee: { toNumber(): number }
  totalPaid: { toNumber(): number }
  discountAmount: { toNumber(): number }
  isActive: boolean
  subCategory: {
    name: string
    category: { name: string }
  }
  payments: CategoryPaymentRecord[]
}

type IssuancePaymentRecord = {
  amount: { toNumber(): number } | number | string
  paymentDate: Date | string
  paymentMethod: string
  referenceNumber?: string | null
}

type StudentIssuanceRecord = {
  id: string
  quantity: number
  unitPrice: { toNumber(): number } | number | string
  totalPaid: { toNumber(): number } | number | string
  issuedDate: Date | string
  item: { name: string }
  payments: IssuancePaymentRecord[]
}

type HostelPaymentRecord = {
  amount: { toNumber(): number } | number | string
  daysPurchased: number
  paymentDate: Date | string
  paymentMethod: string
  referenceNumber?: string | null
}

type HostelAllocationRecord = {
  id: string
  allocationDate: Date | string
  deallocationDate?: Date | string | null
  paidUntil: Date | string
  creditBalance: { toNumber(): number } | number | string
  isActive: boolean
  bed: {
    bedNumber: string
    pricePerDay: { toNumber(): number } | number | string
    room: { roomNumber: string }
  }
  payments: HostelPaymentRecord[]
}

function toNumber(value: { toNumber(): number } | number | string): number {
  if (typeof value === "number") return value
  if (typeof value === "string") return Number(value) || 0
  return value.toNumber()
}

function mapPaymentDetails<T extends CategoryPaymentRecord | IssuancePaymentRecord>(
  payments: T[],
): Array<Omit<T, "amount"> & { amount: number }> {
  return [...payments]
    .sort((a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime())
    .map((payment) => ({
      ...payment,
      amount: toNumber(payment.amount),
      referenceNumber: payment.referenceNumber || undefined,
    }))
}

/** Same pending formula as unified ledger: max(0, finalFee - totalPaid) */
export function calculateCategoryPending(finalFee: number, totalPaid: number): number {
  return Math.max(0, finalFee - totalPaid)
}

/** Same pending formula as unified ledger for issuances */
export function calculateIssuancePending(totalAmount: number, totalPaid: number): number {
  return Math.max(0, totalAmount - totalPaid)
}

/** Same hostel pending/credit logic as unified-ledger-actions */
export function calculateHostelBalances(
  allocation: HostelAllocationRecord,
  currentDate = new Date(),
): { totalPaid: number; pending: number; credit: number; pricePerDay: number } {
  const pricePerDay = toNumber(allocation.bed.pricePerDay) || 0
  const allocationDate = new Date(allocation.allocationDate)
  const paidUntil = new Date(allocation.paidUntil)
  const creditBalance = toNumber(allocation.creditBalance) || 0

  const totalPaid = allocation.payments.reduce((sum, payment) => sum + toNumber(payment.amount), 0)

  const endDate = allocation.isActive
    ? currentDate
    : new Date(allocation.deallocationDate || currentDate)

  const pendingDays = calculatePendingDays(paidUntil, endDate, allocationDate)
  let pending = calculatePendingAmount(pendingDays, pricePerDay)
  pending = Math.max(0, pending - creditBalance)

  let credit = calculateOverpaidAmount(allocationDate, endDate, totalPaid, pricePerDay)
  if (pending === 0 && creditBalance > 0) {
    credit += creditBalance
  }

  return { totalPaid, pending, credit, pricePerDay }
}

export function mapCategoryPaymentItem(
  studentCategory: StudentCategoryRecord,
  studentName: string,
): CategoryPaymentItem {
  const finalFee = toNumber(studentCategory.finalFee)
  const totalPaid = toNumber(studentCategory.totalPaid)
  const discount = toNumber(studentCategory.discountAmount)
  const pendingFees = calculateCategoryPending(finalFee, totalPaid)

  const payments: CategoryPaymentDetail[] = mapPaymentDetails(studentCategory.payments).map(
    (payment) => ({
      amount: payment.amount,
      paymentDate: payment.paymentDate,
      paymentMethod: payment.paymentMethod,
      referenceNumber: payment.referenceNumber ?? undefined,
    }),
  )

  return {
    id: studentCategory.id,
    studentName,
    categoryName: studentCategory.subCategory.category.name,
    subCategoryName: studentCategory.subCategory.name,
    assignedDate: studentCategory.assignedDate,
    fee: finalFee + discount,
    discount,
    finalFee,
    totalPaid,
    pendingFees,
    isActive: studentCategory.isActive,
    payments,
  }
}

export function mapIssuanceItem(
  issuance: StudentIssuanceRecord,
  studentName: string,
): InventoryIssuanceItem {
  const unitPrice = toNumber(issuance.unitPrice)
  const totalAmount = issuance.quantity * unitPrice
  const totalPaid = toNumber(issuance.totalPaid)
  const balanceDue = calculateIssuancePending(totalAmount, totalPaid)

  const payments: IssuancePaymentDetail[] = mapPaymentDetails(issuance.payments).map((payment) => ({
    amount: payment.amount,
    paymentDate: payment.paymentDate,
    paymentMethod: payment.paymentMethod,
    referenceNumber: payment.referenceNumber ?? undefined,
  }))

  return {
    id: issuance.id,
    studentName,
    itemName: issuance.item.name,
    quantity: issuance.quantity,
    unitPrice,
    totalAmount,
    totalPaid,
    balanceDue,
    issuedDate: issuance.issuedDate,
    payments,
  }
}

export function mapHostelPaymentItem(
  allocation: HostelAllocationRecord,
  studentName: string,
  currentDate = new Date(),
): HostelPaymentItem {
  const { totalPaid, pending, credit, pricePerDay } = calculateHostelBalances(
    allocation,
    currentDate,
  )

  const payments: HostelPaymentDetail[] = [...allocation.payments]
    .sort((a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime())
    .map((payment) => ({
      amount: toNumber(payment.amount),
      daysPurchased: payment.daysPurchased,
      paymentDate: payment.paymentDate,
      paymentMethod: payment.paymentMethod,
      referenceNumber: payment.referenceNumber || undefined,
    }))

  return {
    id: allocation.id,
    studentName,
    roomNumber: allocation.bed.room.roomNumber,
    bedNumber: allocation.bed.bedNumber,
    allocationDate: allocation.allocationDate,
    deallocationDate: allocation.deallocationDate || undefined,
    paidUntil: allocation.paidUntil,
    pricePerDay,
    totalPaid,
    pending,
    credit,
    creditBalance: toNumber(allocation.creditBalance),
    isActive: allocation.isActive,
    payments,
  }
}

export function calculateInvoiceTotals(
  categoryPayments: CategoryPaymentItem[],
  inventoryIssuances: InventoryIssuanceItem[],
  hostelPayments: HostelPaymentItem[],
): InvoiceTotals {
  const categoryFinalFee = categoryPayments.reduce((sum, item) => sum + item.finalFee, 0)
  const categoryTotalPaid = categoryPayments.reduce((sum, item) => sum + item.totalPaid, 0)
  const categoryPending = categoryPayments.reduce((sum, item) => sum + item.pendingFees, 0)

  const issuanceTotalAmount = inventoryIssuances.reduce((sum, item) => sum + item.totalAmount, 0)
  const issuanceTotalPaid = inventoryIssuances.reduce((sum, item) => sum + item.totalPaid, 0)
  const issuancePending = inventoryIssuances.reduce((sum, item) => sum + item.balanceDue, 0)

  const hostelTotalPaid = hostelPayments.reduce((sum, item) => sum + item.totalPaid, 0)
  const hostelPending = hostelPayments.reduce((sum, item) => sum + item.pending, 0)
  const hostelCredit = hostelPayments.reduce((sum, item) => sum + item.credit, 0)

  const grandTotalPaid = categoryTotalPaid + issuanceTotalPaid + hostelTotalPaid
  const grandTotalPending = categoryPending + issuancePending + hostelPending

  return {
    categoryFinalFee,
    categoryTotalPaid,
    categoryPending,
    issuanceTotalAmount,
    issuanceTotalPaid,
    issuancePending,
    hostelTotalPaid,
    hostelPending,
    hostelCredit,
    grandTotalPaid,
    grandTotalPending,
  }
}

export function buildStudentInvoiceData(input: {
  student: {
    id: string
    fullname: string
    email: string
    contact_number_student: string
  }
  categoryPayments: CategoryPaymentItem[]
  inventoryIssuances: InventoryIssuanceItem[]
  hostelPayments: HostelPaymentItem[]
}): StudentInvoiceData {
  const totals = calculateInvoiceTotals(
    input.categoryPayments,
    input.inventoryIssuances,
    input.hostelPayments,
  )

  return {
    studentId: input.student.id,
    studentName: input.student.fullname,
    email: input.student.email,
    contactNumber: input.student.contact_number_student,
    invoiceDate: new Date(),
    categoryPayments: input.categoryPayments,
    inventoryIssuances: input.inventoryIssuances,
    hostelPayments: input.hostelPayments,
    totals,
  }
}
