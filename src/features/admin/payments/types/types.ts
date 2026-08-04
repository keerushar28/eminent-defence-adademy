export interface Payment {
  id: string
  amount: number
  paymentDate: Date
  paymentMethod: string
  referenceNumber: string | null
  notes: string | null
  createdBy: string
  studentCategory: {
    id: string
    discountAmount: number
    finalFee: number
    totalPaid: number
    student: {
      id: string
      fullname: string
      email: string
      contact_number_student: string
    }
    subCategory: {
      id: string
      name: string
      fee: number
      category: {
        id: string
        name: string
      }
    }
  }
}

export interface PendingFee {
  id: string
  remaining: number
  finalFee: number
  totalPaid: number
  discountAmount: number
  assignedAt: Date
  assignedDate?: Date
  durationMonths?: number | null
  subCategory: {
    id: string
    name: string
    fee: number
    category: {
      id: string
      name: string
    }
  }
  payments: Array<{
    id: string
    amount: number
    paymentDate: Date
    paymentMethod: string
    referenceNumber: string | null
    notes: string | null
  }>
}
