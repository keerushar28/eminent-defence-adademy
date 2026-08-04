// Inventory Management Constants

// Category Names
export const INVENTORY_CATEGORIES = {
  UNIFORMS: 'Uniforms',
  BOOKS: 'Books',
  HOSTEL_SUPPLIES: 'Hostel Supplies',
  FOOD_ITEMS: 'Food Items',
} as const

export const DEFAULT_CATEGORIES = [
  {
    name: INVENTORY_CATEGORIES.UNIFORMS,
    description: 'Student uniforms and clothing items',
  },
  {
    name: INVENTORY_CATEGORIES.BOOKS,
    description: 'Educational books and learning materials',
  },
  {
    name: INVENTORY_CATEGORIES.HOSTEL_SUPPLIES,
    description: 'Hostel and accommodation supplies',
  },
  {
    name: INVENTORY_CATEGORIES.FOOD_ITEMS,
    description: 'Food and consumable items',
  },
] as const

// Unit of Measurement Options
export const UNIT_OPTIONS = [
  { value: 'piece', label: 'Piece' },
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'gram', label: 'Gram (g)' },
  { value: 'liter', label: 'Liter (L)' },
  { value: 'ml', label: 'Milliliter (ml)' },
  { value: 'box', label: 'Box' },
  { value: 'pack', label: 'Pack' },
  { value: 'set', label: 'Set' },
  { value: 'pair', label: 'Pair' },
  { value: 'dozen', label: 'Dozen' },
  { value: 'meter', label: 'Meter (m)' },
  { value: 'roll', label: 'Roll' },
] as const

// Payment Method Options
export const PAYMENT_METHOD_OPTIONS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'ONLINE', label: 'Online Payment' },
  { value: 'CARD', label: 'Card' },
] as const

// Order Status Options
export const ORDER_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending', color: 'yellow' },
  { value: 'PARTIALLY_RECEIVED', label: 'Partially Received', color: 'blue' },
  { value: 'RECEIVED', label: 'Received', color: 'green' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'red' },
] as const

// Transaction Type Options
export const TRANSACTION_TYPE_OPTIONS = [
  { value: 'STOCK_IN', label: 'Stock In', color: 'green' },
  { value: 'STOCK_OUT', label: 'Stock Out', color: 'red' },
  { value: 'ADJUSTMENT', label: 'Adjustment', color: 'blue' },
  { value: 'RETURN', label: 'Return', color: 'purple' },
] as const

// Issuance Status Options
export const ISSUANCE_STATUS_OPTIONS = [
  { value: 'ISSUED', label: 'Issued', color: 'blue' },
  { value: 'PARTIALLY_RETURNED', label: 'Partially Returned', color: 'yellow' },
  { value: 'RETURNED', label: 'Returned', color: 'green' },
] as const

// Validation Constants
export const VALIDATION_CONSTANTS = {
  // Vendor
  VENDOR_NAME_MIN_LENGTH: 2,
  VENDOR_NAME_MAX_LENGTH: 100,
  VENDOR_PHONE_MIN_LENGTH: 10,
  VENDOR_PHONE_MAX_LENGTH: 15,
  VENDOR_EMAIL_MAX_LENGTH: 100,
  
  // Item
  ITEM_NAME_MIN_LENGTH: 2,
  ITEM_NAME_MAX_LENGTH: 100,
  ITEM_SKU_MIN_LENGTH: 2,
  ITEM_SKU_MAX_LENGTH: 50,
  ITEM_SKU_PATTERN: /^[A-Z0-9-]+$/,
  ITEM_DESCRIPTION_MAX_LENGTH: 500,
  MIN_STOCK_THRESHOLD_MIN: 0,
  MIN_STOCK_THRESHOLD_MAX: 10000,
  UNIT_PRICE_MIN: 0,
  UNIT_PRICE_MAX: 1000000,
  
  // Order
  ORDER_NUMBER_PREFIX: 'ORD',
  ORDER_NOTES_MAX_LENGTH: 500,
  ORDER_ITEM_QUANTITY_MIN: 1,
  ORDER_ITEM_QUANTITY_MAX: 10000,
  
  // Issuance
  ISSUANCE_QUANTITY_MIN: 1,
  ISSUANCE_QUANTITY_MAX: 1000,
  ISSUANCE_NOTES_MAX_LENGTH: 500,
  
  // Transaction
  TRANSACTION_REASON_MAX_LENGTH: 200,
  TRANSACTION_NOTES_MAX_LENGTH: 500,
  
  // Payment
  PAYMENT_AMOUNT_MIN: 0.01,
  PAYMENT_AMOUNT_MAX: 10000000,
  PAYMENT_REFERENCE_MAX_LENGTH: 100,
  PAYMENT_NOTES_MAX_LENGTH: 500,
} as const

// Stock Status Thresholds
export const STOCK_STATUS = {
  OUT_OF_STOCK: 0,
  CRITICAL: 0.25, // 25% of minimum threshold
  LOW: 1.0, // At or below minimum threshold
  ADEQUATE: 2.0, // 2x minimum threshold
} as const

// Stock Status Colors
export const STOCK_STATUS_COLORS = {
  OUT_OF_STOCK: 'red',
  CRITICAL: 'orange',
  LOW: 'yellow',
  ADEQUATE: 'green',
} as const

// Pagination Constants
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  MAX_PAGE_SIZE: 100,
} as const

// Date Range Presets
export const DATE_RANGE_PRESETS = [
  { label: 'Today', days: 0 },
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 3 months', days: 90 },
  { label: 'Last 6 months', days: 180 },
  { label: 'Last year', days: 365 },
] as const

// Reference Types for Stock Transactions
export const REFERENCE_TYPES = {
  ORDER: 'ORDER',
  ISSUANCE: 'ISSUANCE',
  RETURN: 'RETURN',
  ADJUSTMENT: 'ADJUSTMENT',
} as const

// Dashboard Limits
export const DASHBOARD_LIMITS = {
  LOW_STOCK_ITEMS: 10,
  RECENT_TRANSACTIONS: 10,
  PENDING_ORDERS: 5,
  RECENT_ISSUANCES: 10,
} as const

// Export Formats
export const EXPORT_FORMATS = {
  PDF: 'pdf',
  CSV: 'csv',
  EXCEL: 'xlsx',
} as const

// Report Types
export const REPORT_TYPES = {
  EXPENSE: 'expense',
  USAGE: 'usage',
  STOCK_SUMMARY: 'stock_summary',
  VENDOR_SUMMARY: 'vendor_summary',
} as const

// Error Messages
export const ERROR_MESSAGES = {
  // Generic
  GENERIC_ERROR: 'An error occurred. Please try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  
  // Vendor
  VENDOR_NOT_FOUND: 'Vendor not found.',
  VENDOR_CREATE_FAILED: 'Failed to create vendor.',
  VENDOR_UPDATE_FAILED: 'Failed to update vendor.',
  VENDOR_DELETE_FAILED: 'Failed to delete vendor.',
  VENDOR_HAS_ORDERS: 'Cannot delete vendor with existing orders.',
  
  // Item
  ITEM_NOT_FOUND: 'Item not found.',
  ITEM_CREATE_FAILED: 'Failed to create item.',
  ITEM_UPDATE_FAILED: 'Failed to update item.',
  ITEM_DELETE_FAILED: 'Failed to delete item.',
  ITEM_SKU_EXISTS: 'An item with this SKU already exists.',
  ITEM_INSUFFICIENT_STOCK: 'Insufficient stock available.',
  
  // Order
  ORDER_NOT_FOUND: 'Order not found.',
  ORDER_CREATE_FAILED: 'Failed to create order.',
  ORDER_UPDATE_FAILED: 'Failed to update order.',
  ORDER_RECEIVE_FAILED: 'Failed to receive order.',
  ORDER_ALREADY_RECEIVED: 'Order has already been received.',
  
  // Issuance
  ISSUANCE_NOT_FOUND: 'Issuance not found.',
  ISSUANCE_CREATE_FAILED: 'Failed to create issuance.',
  ISSUANCE_RETURN_FAILED: 'Failed to process return.',
  STUDENT_NOT_FOUND: 'Student not found.',
  INVALID_RETURN_QUANTITY: 'Return quantity exceeds issued quantity.',
  
  // Transaction
  TRANSACTION_CREATE_FAILED: 'Failed to create transaction.',
  INVALID_STOCK_ADJUSTMENT: 'Invalid stock adjustment.',
  
  // Category
  CATEGORY_NOT_FOUND: 'Category not found.',
  CATEGORY_CREATE_FAILED: 'Failed to create category.',
} as const

// Success Messages
export const SUCCESS_MESSAGES = {
  // Vendor
  VENDOR_CREATED: 'Vendor created successfully.',
  VENDOR_UPDATED: 'Vendor updated successfully.',
  VENDOR_DELETED: 'Vendor deleted successfully.',
  PAYMENT_RECORDED: 'Payment recorded successfully.',
  
  // Item
  ITEM_CREATED: 'Item created successfully.',
  ITEM_UPDATED: 'Item updated successfully.',
  ITEM_DELETED: 'Item deleted successfully.',
  
  // Order
  ORDER_CREATED: 'Order created successfully.',
  ORDER_UPDATED: 'Order updated successfully.',
  ORDER_RECEIVED: 'Order received successfully.',
  ORDER_CANCELLED: 'Order cancelled successfully.',
  
  // Issuance
  ISSUANCE_CREATED: 'Item issued successfully.',
  ISSUANCE_RETURNED: 'Item returned successfully.',
  
  // Transaction
  STOCK_ADJUSTED: 'Stock adjusted successfully.',
  
  // Category
  CATEGORY_CREATED: 'Category created successfully.',
} as const

// Navigation Routes
export const INVENTORY_ROUTES = {
  DASHBOARD: '/admin/inventory',
  ITEMS: '/admin/inventory/items',
  ITEM_DETAILS: (id: string) => `/admin/inventory/items/${id}`,
  VENDORS: '/admin/inventory/vendors',
  VENDOR_DETAILS: (id: string) => `/admin/inventory/vendors/${id}`,
  ORDERS: '/admin/inventory/orders',
  ORDER_DETAILS: (id: string) => `/admin/inventory/orders/${id}`,
  ISSUANCES: '/admin/inventory/issuances',
  ISSUANCE_DETAILS: (id: string) => `/admin/inventory/issuances/${id}`,
  TRANSACTIONS: '/admin/inventory/transactions',
  REPORTS_EXPENSE: '/admin/inventory/reports/expenses',
  REPORTS_USAGE: '/admin/inventory/reports/usage',
} as const
