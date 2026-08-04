// Hostel Management TypeScript Types

export interface Room {
  id: string;
  roomNumber: string;
  capacity: number;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  beds?: Bed[];
}

export interface Bed {
  id: string;
  roomId: string;
  bedNumber: string;
  pricePerDay: number;
  status: BedStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  room?: Room;
  allocations?: Allocation[];
}

export enum BedStatus {
  AVAILABLE = 'AVAILABLE',
  ALLOCATED = 'ALLOCATED',
  INACTIVE = 'INACTIVE'
}

export interface Allocation {
  id: string;
  studentId: string;
  roomId: string;
  bedId: string;
  allocationDate: Date;
  deallocationDate?: Date;
  paidUntil: Date;
  creditBalance: number; // Leftover balance from partial payments
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  student?: {
    id: string;
    fullname: string;
    email: string;
    contact_number_student: string;
    student_image: string;
  };
  bed?: Bed;
  payments?: Payment[];
}

export interface Payment {
  id: string;
  allocationId: string;
  amount: number;
  paymentDate: Date;
  daysPurchased: number;
  updatedPaidUntil: Date;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  allocation?: Allocation;
}

export interface BillingInfo {
  allocationId: string;
  studentId: string;
  studentName: string;
  roomNumber: string;
  bedNumber: string;
  allocationDate: Date;
  deallocationDate?: Date;
  paidUntil: Date;
  pricePerDay: number;
  totalPayableDays: number;
  pendingDays: number;
  pendingAmount: number;
  overpaidDays: number;
  creditAmount: number;
  isActive: boolean;
}

export interface CreateRoomInput {
  roomNumber: string;
  capacity: number;
  description?: string;
}

export interface UpdateRoomInput {
  roomNumber?: string;
  capacity?: number;
  description?: string;
  isActive?: boolean;
}

export interface CreateBedInput {
  roomId: string;
  bedNumber: string;
  pricePerDay: number;
}

export interface UpdateBedInput {
  bedNumber?: string;
  pricePerDay?: number;
  status?: BedStatus;
  isActive?: boolean;
}

export interface CreateAllocationInput {
  studentId: string;
  bedId: string;
  allocationDate: Date;
  paidUntil: Date;
  notes?: string;
}

export interface CreatePaymentInput {
  allocationId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'ONLINE' | 'CARD';
  referenceNumber?: string;
  notes?: string;
  createdBy: string;
}

export interface DeallocationWarning {
  hasWarning: boolean;
  pendingAmount: number;
  message: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListRoomsParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface ListBedsParams {
  page?: number;
  limit?: number;
  roomId?: string;
  status?: BedStatus;
}

export interface ListAllocationsParams {
  page?: number;
  limit?: number;
  studentId?: string;
  roomId?: string;
  isActive?: boolean;
}

export interface ListPaymentsParams {
  page?: number;
  limit?: number;
  studentId?: string;
  allocationId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface StudentFinancialView {
  allocations: BillingInfo[];
  totalPending: number;
  totalCredit: number;
  finalBalance: number;
}
