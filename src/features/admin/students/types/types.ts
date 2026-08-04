export interface IStudent {
  id: string;
  student_image: string;
  fullname: string;
  gender: "MALE" | "FEMALE";
  dob: Date; // ISO date string
  parentName: string;
  guardianName?: string; // Optional guardian name
  dress: boolean;
  books: boolean;
  hostel: boolean;
  citizenship_number: string;
  blood_group:
    | "A_POSITIVE"
    | "A_NEGATIVE"
    | "B_POSITIVE"
    | "B_NEGATIVE"
    | "AB_POSITIVE"
    | "AB_NEGATIVE"
    | "O_POSITIVE"
    | "O_NEGATIVE";
  permanent_address: string;
  temporary_address: string;
  contact_number_student: string;
  contact_number_parent: string;
  height: string;
  heightUnit?: string;
  weight: string;
  weightUnit?: string;
  qualifications: string[];
  email: string;
  images?: string[]; // Array of attachment file URLs
  subCategoryIds?: string[]; // Optional subcategories to assign
  studentCategories?: IStudentCategory[]; // Assigned categories
  hostelAllocations?: IHostelAllocation[]; // Hostel allocations
  isSelected?: boolean; // Whether student is selected
  selectedAt?: Date | null; // When student was selected
  createdAt: Date; // Registration date
}

export interface IHostelAllocation {
  id: string;
  studentId: string;
  bedId: string;
  allocationDate: Date;
  deallocationDate?: Date | null;
  paidUntil: Date;
  creditBalance: number;
  isActive: boolean;
  bed?: {
    id: string;
    bedNumber: string;
    room?: {
      id: string;
      roomNumber: string;
    };
  };
  payments?: IHostelPayment[];
}

export interface IHostelPayment {
  id: string;
  allocationId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  referenceNumber?: string | null;
  daysPurchased: number;
}

export interface IStudentCategory {
  id: string;
  studentId: string;
  subCategoryId: string;
  assignedAt: Date;
  assignedDate?: Date | string;
  durationMonths?: number | null;
  discountAmount?: number | string;
  finalFee?: number | string;
  totalPaid?: number | string;
  notes?: string;
  isActive?: boolean;
  subCategory?: {
    id: string;
    name: string;
    fee: number | string;
    category: {
      id: string;
      name: string;
    };
  };
}
