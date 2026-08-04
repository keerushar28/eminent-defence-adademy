"use server";

import { prisma } from "@/features/core/lib/prisma";
import {
  calculatePendingDays,
  calculatePendingAmount,
  calculateOverpaidAmount,
} from "@/features/admin/hostel/lib/calculations";

export interface UnifiedStudentLedger {
  id: string;
  fullname: string;
  email: string;
  student_image: string;
  // Category fees
  categoryTotalFee: number;
  categoryTotalPaid: number;
  categoryTotalDiscount: number;
  categoryPending: number;
  // Inventory issuance fees
  issuanceTotalAmount: number;
  issuanceTotalPaid: number;
  issuancePending: number;
  // Hostel fees
  hostelTotalPaid: number;
  hostelPending: number;
  hostelCredit: number;
  // Combined totals
  grandTotalFee: number;
  grandTotalPaid: number;
  grandTotalPending: number;
  // Status
  status: "FULLY_PAID" | "PENDING" | "UNPAID" | "NO_ALLOCATION";
  lastPaymentDate: Date | null;
  // Allocation flags
  hasActiveHostel: boolean;
  hasDeallocatedHostel: boolean;
  hasCategoryAssignment: boolean;
  hasIssuance: boolean;
  // For filtering
  categoryIds: string[];
  subCategoryIds: string[];
  roomIds: string[];
}

export interface FilterOption {
  id: string;
  label: string;
  parentLabel?: string;
}

export interface LedgerFilterOptions {
  categories: FilterOption[];
  subCategories: FilterOption[];
  rooms: FilterOption[];
}

export interface UnifiedLedgerSummary {
  totalStudents: number;
  fullyPaid: number;
  pending: number;
  unpaid: number;
  noAllocation: number;
  totalFeesCollected: number;
  totalPendingFees: number;
  // Breakdown
  categoryCollected: number;
  categoryPending: number;
  issuanceCollected: number;
  issuancePending: number;
  hostelCollected: number;
  hostelPending: number;
}

export interface StudentLedgerDetail {
  student: {
    id: string;
    fullname: string;
    email: string;
    student_image: string;
    contact_number_student: string;
  };
  categories: {
    id: string;
    categoryName: string;
    subCategoryName: string;
    fee: number;
    discount: number;
    finalFee: number;
    paid: number;
    pending: number;
    assignedDate: Date;
    isActive: boolean;
  }[];
  issuances: {
    id: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    totalPaid: number;
    pending: number;
    issuedDate: Date;
    status: string;
  }[];
  hostel: {
    allocationId: string;
    roomNumber: string;
    bedNumber: string;
    pricePerDay: number;
    allocationDate: Date;
    totalPaid: number;
    pending: number;
    credit: number;
    isActive: boolean;
  }[];
  summary: {
    categoryTotal: number;
    categoryPaid: number;
    categoryPending: number;
    issuanceTotal: number;
    issuancePaid: number;
    issuancePending: number;
    hostelPaid: number;
    hostelPending: number;
    hostelCredit: number;
    grandTotal: number;
    grandPaid: number;
    grandPending: number;
  };
}

export async function getUnifiedLedgerData(): Promise<{
  students: UnifiedStudentLedger[];
  summary: UnifiedLedgerSummary;
}> {
  try {
    // Get all students with their category assignments, issuances, and hostel allocations
    const students = await prisma.student.findMany({
      include: {
        studentCategories: {
          include: {
            subCategory: {
              include: {
                category: true,
              },
            },
            payments: {
              orderBy: { paymentDate: "desc" },
            },
          },
        },
        issuances: {
          include: {
            item: true,
            payments: {
              orderBy: { paymentDate: "desc" },
            },
          },
        },
        hostelAllocations: {
          include: {
            bed: {
              include: {
                room: true,
              },
            },
            payments: {
              orderBy: { paymentDate: "desc" },
            },
          },
        },
      },
      orderBy: { fullname: "asc" },
    });

    const currentDate = new Date();
    const ledgerStudents: UnifiedStudentLedger[] = [];

    for (const student of students) {
      // Calculate category totals
      let categoryTotalFee = 0;
      let categoryTotalPaid = 0;
      let categoryTotalDiscount = 0;
      let lastCategoryPayment: Date | null = null;

      for (const sc of student.studentCategories) {
        categoryTotalFee += sc.finalFee.toNumber();
        categoryTotalPaid += sc.totalPaid.toNumber();
        categoryTotalDiscount += sc.discountAmount.toNumber();
        
        if (sc.payments.length > 0 && sc.payments[0].paymentDate) {
          if (!lastCategoryPayment || sc.payments[0].paymentDate > lastCategoryPayment) {
            lastCategoryPayment = sc.payments[0].paymentDate;
          }
        }
      }

      // Calculate issuance totals
      let issuanceTotalAmount = 0;
      let issuanceTotalPaid = 0;
      let lastIssuancePayment: Date | null = null;

      for (const issuance of student.issuances) {
        const totalAmount = issuance.quantity * (Number(issuance.unitPrice) || 0);
        issuanceTotalAmount += totalAmount;
        issuanceTotalPaid += Number(issuance.totalPaid) || 0;
        
        if (issuance.payments && issuance.payments.length > 0) {
          if (!lastIssuancePayment || issuance.payments[0].paymentDate > lastIssuancePayment) {
            lastIssuancePayment = issuance.payments[0].paymentDate;
          }
        }
      }

      // Calculate hostel totals
      let hostelTotalPaid = 0;
      let hostelPending = 0;
      let hostelCredit = 0;
      let lastHostelPayment: Date | null = null;

      for (const allocation of student.hostelAllocations) {
        const pricePerDay = Number(allocation.bed.pricePerDay) || 0;
        const allocationDate = new Date(allocation.allocationDate);
        const paidUntil = new Date(allocation.paidUntil);
        const creditBalance = Number(allocation.creditBalance) || 0;
        
        // Calculate total paid from payments
        const totalPaid = allocation.payments.reduce(
          (sum, p) => sum + Number(p.amount),
          0
        );
        hostelTotalPaid += totalPaid;

        // Use the same calculation logic as hostel module
        const endDate = allocation.isActive ? currentDate : (allocation.deallocationDate || currentDate);
        
        // Calculate pending days using the hostel module's calculation
        const pendingDays = calculatePendingDays(paidUntil, endDate, allocationDate);
        let pendingAmount = calculatePendingAmount(pendingDays, pricePerDay);
        
        // Subtract credit balance from pending amount (partial payments not yet converted to days)
        pendingAmount = Math.max(0, pendingAmount - creditBalance);
        
        // Calculate credit/overpaid amount - add creditBalance to overpaid
        let creditAmount = calculateOverpaidAmount(allocationDate, endDate, totalPaid, pricePerDay);
        // If there's no pending and there's credit balance, add it to credit
        if (pendingAmount === 0 && creditBalance > 0) {
          creditAmount += creditBalance;
        }
        
        hostelPending += pendingAmount;
        hostelCredit += creditAmount;

        if (allocation.payments.length > 0) {
          if (!lastHostelPayment || allocation.payments[0].paymentDate > lastHostelPayment) {
            lastHostelPayment = allocation.payments[0].paymentDate;
          }
        }
      }

      // Calculate combined totals
      const categoryPending = Math.max(0, categoryTotalFee - categoryTotalPaid);
      const issuancePending = Math.max(0, issuanceTotalAmount - issuanceTotalPaid);
      
      const grandTotalFee = categoryTotalFee + issuanceTotalAmount;
      const grandTotalPaid = categoryTotalPaid + issuanceTotalPaid + hostelTotalPaid;
      const grandTotalPending = categoryPending + issuancePending + hostelPending;

      // Determine last payment date
      const paymentDates = [lastCategoryPayment, lastIssuancePayment, lastHostelPayment].filter(Boolean) as Date[];
      const lastPaymentDate = paymentDates.length > 0 
        ? paymentDates.reduce((latest, date) => date > latest ? date : latest)
        : null;

      // Determine status
      let status: "FULLY_PAID" | "PENDING" | "UNPAID" | "NO_ALLOCATION";
      const hasAllocations = student.studentCategories.length > 0 || 
                            student.issuances.length > 0 || 
                            student.hostelAllocations.length > 0;

      if (!hasAllocations) {
        status = "NO_ALLOCATION";
      } else if (grandTotalPending <= 0) {
        status = "FULLY_PAID";
      } else if (grandTotalPaid === 0) {
        status = "UNPAID";
      } else {
        status = "PENDING";
      }

      ledgerStudents.push({
        id: student.id,
        fullname: student.fullname,
        email: student.email,
        student_image: student.student_image,
        categoryTotalFee,
        categoryTotalPaid,
        categoryTotalDiscount,
        categoryPending,
        issuanceTotalAmount,
        issuanceTotalPaid,
        issuancePending,
        hostelTotalPaid,
        hostelPending,
        hostelCredit,
        grandTotalFee,
        grandTotalPaid,
        grandTotalPending,
        status,
        lastPaymentDate,
        hasActiveHostel: student.hostelAllocations.some(a => a.isActive),
        hasDeallocatedHostel: student.hostelAllocations.some(a => !a.isActive),
        hasCategoryAssignment: student.studentCategories.length > 0,
        hasIssuance: student.issuances.length > 0,
        categoryIds: [...new Set(student.studentCategories.map(sc => sc.subCategory.category.id))],
        subCategoryIds: [...new Set(student.studentCategories.map(sc => sc.subCategoryId))],
        roomIds: [...new Set(student.hostelAllocations.map(a => a.bed.room.id))],
      });
    }

    // Calculate summary
    const summary: UnifiedLedgerSummary = {
      totalStudents: ledgerStudents.length,
      fullyPaid: ledgerStudents.filter(s => s.status === "FULLY_PAID").length,
      pending: ledgerStudents.filter(s => s.status === "PENDING").length,
      unpaid: ledgerStudents.filter(s => s.status === "UNPAID").length,
      noAllocation: ledgerStudents.filter(s => s.status === "NO_ALLOCATION").length,
      totalFeesCollected: ledgerStudents.reduce((sum, s) => sum + s.grandTotalPaid, 0),
      totalPendingFees: ledgerStudents.reduce((sum, s) => sum + s.grandTotalPending, 0),
      categoryCollected: ledgerStudents.reduce((sum, s) => sum + s.categoryTotalPaid, 0),
      categoryPending: ledgerStudents.reduce((sum, s) => sum + s.categoryPending, 0),
      issuanceCollected: ledgerStudents.reduce((sum, s) => sum + s.issuanceTotalPaid, 0),
      issuancePending: ledgerStudents.reduce((sum, s) => sum + s.issuancePending, 0),
      hostelCollected: ledgerStudents.reduce((sum, s) => sum + s.hostelTotalPaid, 0),
      hostelPending: ledgerStudents.reduce((sum, s) => sum + s.hostelPending, 0),
    };

    return { students: ledgerStudents, summary };
  } catch (error) {
    console.error("Error fetching unified ledger data:", error);
    throw new Error("Failed to fetch unified ledger data");
  }
}


export async function getStudentLedgerDetail(studentId: string): Promise<StudentLedgerDetail> {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        studentCategories: {
          include: {
            subCategory: {
              include: {
                category: true,
              },
            },
            payments: {
              orderBy: { paymentDate: "desc" },
            },
          },
        },
        issuances: {
          include: {
            item: true,
            payments: {
              orderBy: { paymentDate: "desc" },
            },
          },
        },
        hostelAllocations: {
          include: {
            bed: {
              include: {
                room: true,
              },
            },
            payments: {
              orderBy: { paymentDate: "desc" },
            },
          },
        },
      },
    });

    if (!student) {
      throw new Error("Student not found");
    }

    const currentDate = new Date();

    // Map categories
    const categories = student.studentCategories.map(sc => ({
      id: sc.id,
      categoryName: sc.subCategory.category.name,
      subCategoryName: sc.subCategory.name,
      fee: sc.subCategory.fee.toNumber(),
      discount: sc.discountAmount.toNumber(),
      finalFee: sc.finalFee.toNumber(),
      paid: sc.totalPaid.toNumber(),
      pending: Math.max(0, sc.finalFee.toNumber() - sc.totalPaid.toNumber()),
      assignedDate: sc.assignedDate,
      isActive: sc.isActive,
    }));

    // Map issuances
    const issuances = student.issuances.map(issuance => {
      const totalAmount = issuance.quantity * (Number(issuance.unitPrice) || 0);
      const totalPaid = Number(issuance.totalPaid) || 0;
      return {
        id: issuance.id,
        itemName: issuance.item?.name || "Unknown Item",
        quantity: issuance.quantity,
        unitPrice: Number(issuance.unitPrice) || 0,
        totalAmount,
        totalPaid,
        pending: Math.max(0, totalAmount - totalPaid),
        issuedDate: issuance.issuedDate,
        status: issuance.status,
      };
    });

    // Map hostel allocations
    const hostel = student.hostelAllocations.map(allocation => {
      const pricePerDay = Number(allocation.bed.pricePerDay) || 0;
      const allocationDate = new Date(allocation.allocationDate);
      const paidUntil = new Date(allocation.paidUntil);
      const creditBalance = Number(allocation.creditBalance) || 0;
      
      const totalPaid = allocation.payments.reduce(
        (sum, p) => sum + Number(p.amount),
        0
      );

      const endDate = allocation.isActive ? currentDate : (allocation.deallocationDate || currentDate);
      
      // Use the same calculation logic as hostel module
      const pendingDays = calculatePendingDays(paidUntil, endDate, allocationDate);
      let pending = calculatePendingAmount(pendingDays, pricePerDay);
      
      // Subtract credit balance from pending amount
      pending = Math.max(0, pending - creditBalance);
      
      let credit = calculateOverpaidAmount(allocationDate, endDate, totalPaid, pricePerDay);
      // If there's no pending and there's credit balance, add it to credit
      if (pending === 0 && creditBalance > 0) {
        credit += creditBalance;
      }

      return {
        allocationId: allocation.id,
        roomNumber: allocation.bed.room.roomNumber,
        bedNumber: allocation.bed.bedNumber,
        pricePerDay,
        allocationDate: allocation.allocationDate,
        totalPaid,
        pending,
        credit,
        isActive: allocation.isActive,
      };
    });

    // Calculate summary
    const categoryTotal = categories.reduce((sum, c) => sum + c.finalFee, 0);
    const categoryPaid = categories.reduce((sum, c) => sum + c.paid, 0);
    const categoryPending = categories.reduce((sum, c) => sum + c.pending, 0);

    const issuanceTotal = issuances.reduce((sum, i) => sum + i.totalAmount, 0);
    const issuancePaid = issuances.reduce((sum, i) => sum + i.totalPaid, 0);
    const issuancePending = issuances.reduce((sum, i) => sum + i.pending, 0);

    const hostelPaid = hostel.reduce((sum, h) => sum + h.totalPaid, 0);
    const hostelPending = hostel.reduce((sum, h) => sum + h.pending, 0);
    const hostelCredit = hostel.reduce((sum, h) => sum + h.credit, 0);

    return {
      student: {
        id: student.id,
        fullname: student.fullname,
        email: student.email,
        student_image: student.student_image,
        contact_number_student: student.contact_number_student,
      },
      categories,
      issuances,
      hostel,
      summary: {
        categoryTotal,
        categoryPaid,
        categoryPending,
        issuanceTotal,
        issuancePaid,
        issuancePending,
        hostelPaid,
        hostelPending,
        hostelCredit,
        grandTotal: categoryTotal + issuanceTotal,
        grandPaid: categoryPaid + issuancePaid + hostelPaid,
        grandPending: categoryPending + issuancePending + hostelPending,
      },
    };
  } catch (error) {
    console.error("Error fetching student ledger detail:", error);
    throw new Error("Failed to fetch student ledger detail");
  }
}

// Get student's pending issuances
export async function getStudentPendingIssuances(studentId: string) {
  try {
    const issuances = await prisma.studentIssuance.findMany({
      where: {
        studentId,
      },
      include: {
        item: true,
        payments: {
          orderBy: { paymentDate: "desc" },
        },
      },
      orderBy: { issuedDate: "desc" },
    });

    return issuances
      .map(issuance => {
        const totalAmount = issuance.quantity * (Number(issuance.unitPrice) || 0);
        const totalPaid = Number(issuance.totalPaid) || 0;
        const remaining = totalAmount - totalPaid;

        return {
          id: issuance.id,
          itemName: issuance.item?.name || "Unknown",
          itemUnit: issuance.item?.unit || "",
          quantity: issuance.quantity,
          unitPrice: Number(issuance.unitPrice) || 0,
          totalAmount,
          totalPaid,
          remaining,
          issuedDate: issuance.issuedDate,
          status: issuance.status,
        };
      })
      .filter(i => i.remaining > 0);
  } catch (error) {
    console.error("Error fetching pending issuances:", error);
    throw new Error("Failed to fetch pending issuances");
  }
}

// Get student's pending hostel allocations (includes inactive with pending amounts)
export async function getStudentPendingHostelAllocations(studentId: string) {
  try {
    const allocations = await prisma.hostelAllocation.findMany({
      where: {
        studentId,
      },
      include: {
        bed: {
          include: {
            room: true,
          },
        },
        payments: {
          orderBy: { paymentDate: "desc" },
        },
      },
      orderBy: { allocationDate: "desc" },
    });

    return allocations.map(allocation => {
      // For deallocated allocations, use deallocation date; otherwise use today
      const currentDate = !allocation.isActive && allocation.deallocationDate
        ? new Date(allocation.deallocationDate)
        : new Date();

      const pricePerDay = Number(allocation.bed.pricePerDay) || 0;
      const allocationDate = new Date(allocation.allocationDate);
      const paidUntil = new Date(allocation.paidUntil);
      const creditBalance = Number(allocation.creditBalance) || 0;
      
      const totalPaid = allocation.payments.reduce(
        (sum, p) => sum + Number(p.amount),
        0
      );

      // Use the same calculation logic as hostel module
      const pendingDays = calculatePendingDays(paidUntil, currentDate, allocationDate);
      let pending = calculatePendingAmount(pendingDays, pricePerDay);
      
      // Subtract credit balance from pending amount
      pending = Math.max(0, pending - creditBalance);
      
      let credit = calculateOverpaidAmount(allocationDate, currentDate, totalPaid, pricePerDay);
      // If there's no pending and there's credit balance, add it to credit
      if (pending === 0 && creditBalance > 0) {
        credit += creditBalance;
      }
      
      // Calculate days consumed for display
      const daysConsumed = Math.max(0, Math.round((new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())).getTime() - new Date(Date.UTC(allocationDate.getFullYear(), allocationDate.getMonth(), allocationDate.getDate())).getTime()) / (1000 * 60 * 60 * 24)));
      const amountConsumed = daysConsumed * pricePerDay;

      return {
        id: allocation.id,
        roomNumber: allocation.bed.room.roomNumber,
        bedNumber: allocation.bed.bedNumber,
        pricePerDay,
        allocationDate: allocation.allocationDate,
        paidUntil: allocation.paidUntil,
        totalPaid,
        daysConsumed,
        amountConsumed,
        pending,
        credit,
        creditBalance,
        isPending: pending > 0,
        isActive: allocation.isActive,
      };
    });
  } catch (error) {
    console.error("Error fetching pending hostel allocations:", error);
    throw new Error("Failed to fetch pending hostel allocations");
  }
}

export async function getLedgerFilterOptions(): Promise<LedgerFilterOptions> {
  const [categories, rooms] = await Promise.all([
    prisma.category.findMany({
      include: { subCategories: true },
      orderBy: { name: "asc" },
    }),
    prisma.hostelRoom.findMany({
      where: { isActive: true },
      orderBy: { roomNumber: "asc" },
    }),
  ]);

  return {
    categories: categories.map(c => ({ id: c.id, label: c.name })),
    subCategories: categories.flatMap(c =>
      c.subCategories.map(sc => ({ id: sc.id, label: sc.name, parentLabel: c.name }))
    ),
    rooms: rooms.map(r => ({ id: r.id, label: `Room ${r.roomNumber}` })),
  };
}
