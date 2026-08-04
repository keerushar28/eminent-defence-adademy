// Inventory Management Type Definitions

// Enums
export type OrderStatus = 'PENDING' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED'
export type TransactionType = 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT' | 'RETURN'
export type IssuanceStatus = 'ISSUED' | 'PARTIALLY_RETURNED' | 'RETURNED'
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'ONLINE' | 'CARD'

// Vendor Interfaces
export interface IVendor {
  id: string
  name: string
  contactPerson?: string | null
  email?: string | null
  phone: string
  address?: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface IVendorPayment {
  id: string
  vendorId: string
  amount: number
  paymentDate: Date
  paymentMethod: PaymentMethod
  referenceNumber?: string | null
  notes?: string | null
  createdBy: string
  createdAt: Date
  vendor?: IVendor
}

export interface IVendorItem {
  id: string
  vendorId: string
  itemId: string
  createdAt: Date
  vendor?: IVendor
  item?: IInventoryItem
}

// Category Interfaces
export interface IInventoryCategory {
  id: string
  name: string
  description?: string | null
  isBilling: boolean
  createdAt: Date
}

// Item Interfaces
export interface IInventoryItem {
  id: string
  name: string
  description?: string | null
  categoryId: string
  category?: IInventoryCategory
  sku: string
  unit: string
  currentStock: number
  minStockThreshold: number
  unitPrice?: number | null
  isActive: boolean
  isDeleted: boolean
  deletedAt?: Date | null
  createdAt: Date
  updatedAt: Date
  vendors?: IVendorItem[]
}

// Order Interfaces
export interface IOrder {
  id: string
  orderNumber: string
  vendorId: string
  vendor?: IVendor
  orderDate: Date
  expectedDelivery?: Date | null
  status: OrderStatus
  totalAmount: number
  notes?: string | null
  createdBy: string
  receivedBy?: string | null
  receivedAt?: Date | null
  createdAt: Date
  updatedAt: Date
  isDeleted: boolean
  deletedAt?: Date | null
  items?: IOrderItem[]
}

export interface IOrderItem {
  id: string
  orderId: string
  itemId: string
  item?: IInventoryItem
  quantity: number
  unitPrice: number
  receivedQty: number
  order?: IOrder
}

// Stock Transaction Interfaces
export interface IStockTransaction {
  id: string
  itemId: string
  item?: IInventoryItem
  transactionType: TransactionType
  quantity: number
  balanceAfter: number
  reason?: string | null
  referenceId?: string | null
  referenceType?: string | null
  performedBy: string
  transactionDate: Date
  notes?: string | null
}

// Student Issuance Interfaces
export interface IStudentIssuance {
  id: string
  studentId: string
  student?: IStudent
  itemId: string
  item?: IInventoryItem
  quantity: number
  unitPrice?: number | null
  totalAmount?: number | null
  totalPaid?: number | null
  issuedDate: Date
  returnedDate?: Date | null
  returnedQty: number
  status: IssuanceStatus
  issuedBy: string
  notes?: string | null
  isDeleted: boolean
  deletedAt?: Date | null
  createdAt?: Date
  payments?: IIssuancePayment[]
}

export interface IIssuancePayment {
  id: string
  issuanceId: string
  amount: number
  paymentDate: Date
  paymentMethod: PaymentMethod
  referenceNumber?: string | null
  notes?: string | null
  createdBy: string
  createdAt: Date
}

// Student Interface (minimal, for issuance context)
export interface IStudent {
  id: string
  fullname: string
  student_image: string
  email: string
  contact_number_student: string
}

// Form Data Types
export interface VendorFormData {
  name: string
  contactPerson?: string
  email?: string
  phone: string
  address?: string
  isActive: boolean
}

export interface VendorPaymentFormData {
  vendorId: string
  amount: number
  paymentDate: Date
  paymentMethod: PaymentMethod
  referenceNumber?: string
  notes?: string
}

export interface ItemFormData {
  name: string
  description?: string
  categoryId: string
  sku: string
  unit: string
  minStockThreshold: number
  unitPrice?: number
  isActive: boolean
  vendorIds?: string[]
}

export interface OrderFormData {
  vendorId: string
  expectedDelivery?: Date
  notes?: string
  items: OrderItemFormData[]
}

export interface OrderItemFormData {
  itemId: string
  quantity: number
  unitPrice: number
}

export interface IssuanceFormData {
  studentId: string
  itemId: string
  quantity: number
  notes?: string
}

export interface StockAdjustmentFormData {
  itemId: string
  quantity: number
  reason: string
  notes?: string
}

// Report Types
export interface ExpenseReportData {
  totalExpenses: number
  expensesByCategory: CategoryExpense[]
  expensesByVendor: VendorExpense[]
  expensesByItem: ItemExpense[]
  dateRange: {
    from: Date
    to: Date
  }
}

export interface CategoryExpense {
  categoryId: string
  categoryName: string
  totalAmount: number
  itemCount: number
  averageCost: number
}

export interface VendorExpense {
  vendorId: string
  vendorName: string
  totalAmount: number
  orderCount: number
  paymentCount: number
}

export interface ItemExpense {
  itemId: string
  itemName: string
  categoryName: string
  totalAmount: number
  quantityPurchased: number
  averageUnitPrice: number
}

export interface UsageReportData {
  items: ItemUsage[]
  dateRange: {
    from: Date
    to: Date
  }
  summary: {
    totalStockIn: number
    totalStockOut: number
    totalIssuances: number
    totalReturns: number
  }
}

export interface ItemUsage {
  itemId: string
  itemName: string
  categoryName: string
  unit: string
  openingStock: number
  stockIn: number
  stockOut: number
  issuances: number
  returns: number
  closingStock: number
  consumptionRate: number
}

// Dashboard Types
export interface DashboardStats {
  totalItems: number
  lowStockCount: number
  pendingOrders: number
  recentIssuances: number
  totalValue: number
  lowStockItems: IInventoryItem[]
  recentTransactions: IStockTransaction[]
  pendingOrdersList: IOrder[]
}

// Filter Types
export interface TransactionFilters {
  dateFrom?: Date
  dateTo?: Date
  itemId?: string
  categoryId?: string
  transactionType?: TransactionType
  performedBy?: string
}

export interface IssuanceFilters {
  dateFrom?: Date
  dateTo?: Date
  studentId?: string
  itemId?: string
  status?: IssuanceStatus
}

export interface OrderFilters {
  dateFrom?: Date
  dateTo?: Date
  vendorId?: string
  status?: OrderStatus
}

export interface ItemFilters {
  categoryId?: string
  lowStock?: boolean
  isActive?: boolean
  searchQuery?: string
}
