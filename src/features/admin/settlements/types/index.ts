export interface SettlementStats {
  totalCollected: number;
  totalSettled: number;
  remainingSettlement: number;
  totalPayments: number;
}

export interface PaymentWithDetails {
  id: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  referenceNumber: string | null;
  notes: string | null;
  createdBy: string;
  createdByUser?: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
  settlementId: string | null;
  isSettled: boolean;
  approvedBy?: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
  type: 'CATEGORY' | 'HOSTEL' | 'ISSUANCE';
  
  // Category payment details
  studentCategory?: {
    id: string;
    student: {
      id: string;
      fullname: string;
      email: string;
    };
    subCategory: {
      id: string;
      name: string;
      category: {
        id: string;
        name: string;
      };
    };
  };
  
  // Hostel payment details
  hostelAllocation?: {
    id: string;
    student: {
      id: string;
      fullname: string;
      email: string;
    };
    bed: {
      id: string;
      bedNumber: string;
      room: {
        id: string;
        roomNumber: string;
      };
    };
  };
  
  // Issuance payment details
  issuance?: {
    id: string;
    student: {
      id: string;
      fullname: string;
      email: string;
    };
    item: {
      id: string;
      name: string;
      category: {
        id: string;
        name: string;
      };
    };
  };
}

export interface GetPaymentsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  type?: 'ALL' | 'CATEGORY' | 'HOSTEL' | 'ISSUANCE';
  isSettled?: boolean;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  createdBy?: string;
  approvedBy?: string;
}

export interface CreateSettlementParams {
  paymentIds: string[];
  notes?: string;
}

export interface UpdatePaymentStatusParams {
  paymentId: string;
  paymentType: 'CATEGORY' | 'HOSTEL' | 'ISSUANCE';
  isSettled: boolean;
  settlementDetails?: {
    notes?: string;
  };
}

export interface PaymentDetailsResponse {
  success: boolean;
  error?: string;
  payment?: {
    id: string;
    amount: number;
    paymentDate: Date;
    paymentMethod: string;
    referenceNumber: string | null;
    notes: string | null;
    createdBy: string;
    settlement: {
      id: string;
      amount: number;
      settlementDate: Date;
      paymentMethod: string;
      referenceNumber: string | null;
      notes: string | null;
      recordedBy: string;
    } | null;
  };
}