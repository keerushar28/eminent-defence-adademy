/**
 * Usage Examples for calculatePaymentStatus Function
 * 
 * This file demonstrates how to use the calculatePaymentStatus function
 * in various scenarios throughout the hostel management system.
 */

import { calculatePaymentStatus, calculatePaymentStatusFromDates } from './calculations';

// ============================================================================
// Example 1: Calculate payment status with payment records
// ============================================================================
export function exampleWithPayments() {
  const allocationDate = new Date('2024-10-18');
  const currentDate = new Date('2024-10-22'); // 5 days later
  const pricePerDay = 500;
  
  // Student made a partial payment of NPR 750
  const payments = [
    { amount: 750 }
  ];
  
  const status = calculatePaymentStatus(
    allocationDate,
    payments,
    pricePerDay,
    currentDate
  );
  
  console.log(status);
  // Output:
  // {
  //   status: 'PENDING',
  //   totalDaysStayed: 5,
  //   totalAmountOwed: 2500,
  //   totalAmountPaid: 750,
  //   remainingBalance: 1750,
  //   creditBalance: 0,
  //   daysStayed: 5,
  //   daysPaid: 1,
  //   pricePerDay: 500,
  //   message: 'Pending payment of NPR 1750.00 for 4 day(s)'
  // }
}

// ============================================================================
// Example 2: Calculate payment status with multiple payments
// ============================================================================
export function exampleWithMultiplePayments() {
  const allocationDate = new Date('2024-10-18');
  const currentDate = new Date('2024-10-22');
  const pricePerDay = 500;
  
  // Student made multiple payments
  const payments = [
    { amount: 500 },  // First payment
    { amount: 1000 }, // Second payment
    { amount: 250 }   // Third payment
  ];
  
  const status = calculatePaymentStatus(
    allocationDate,
    payments,
    pricePerDay,
    currentDate
  );
  
  // Total paid: NPR 1750, Total owed: NPR 2500, Remaining: NPR 750
  return status;
}

// ============================================================================
// Example 3: Calculate payment status using paidUntil date
// ============================================================================
export function exampleWithPaidUntilDate() {
  const allocationDate = new Date('2024-10-18');
  const paidUntil = new Date('2024-10-19'); // Paid for 2 days
  const currentDate = new Date('2024-10-22'); // 5 days total
  const pricePerDay = 500;
  
  const status = calculatePaymentStatusFromDates(
    allocationDate,
    paidUntil,
    pricePerDay,
    currentDate
  );
  
  // Paid for 2 days (NPR 1000), stayed 5 days (NPR 2500), pending NPR 1500
  return status;
}

// ============================================================================
// Example 4: Use in allocation list component
// ============================================================================
export function exampleInAllocationList(allocations: Record<string, unknown>[]) {
  return allocations.map(allocation => {
    const status = calculatePaymentStatus(
      new Date(allocation.allocationDate as string | number | Date),
      ((allocation.payments as Record<string, unknown>[]) || []).map(p => ({ amount: (p as Record<string, unknown>).amount as number })),
      (allocation.bed as Record<string, unknown>)?.pricePerDay as number || 0,
      new Date()
    );
    
    return {
      ...allocation,
      paymentStatus: status.status,
      remainingBalance: status.remainingBalance,
      creditBalance: status.creditBalance,
      statusMessage: status.message,
    };
  });
}

// ============================================================================
// Example 5: Display payment status badge
// ============================================================================
export function getPaymentStatusBadge(status: string) {
  switch (status) {
    case 'PENDING':
      return {
        variant: 'destructive',
        label: 'Pending',
        icon: 'AlertCircle'
      };
    case 'OVERPAID':
      return {
        variant: 'secondary',
        label: 'Credit',
        icon: 'CheckCircle'
      };
    case 'UP_TO_DATE':
      return {
        variant: 'default',
        label: 'Paid Up',
        icon: 'Check'
      };
    default:
      return {
        variant: 'outline',
        label: 'Unknown',
        icon: 'HelpCircle'
      };
  }
}

// ============================================================================
// Example 6: Check if student can be deallocated
// ============================================================================
export function canDeallocateStudent(allocation: Record<string, unknown>): {
  canDeallocate: boolean;
  warning?: string;
} {
  const status = calculatePaymentStatus(
    new Date(allocation.allocationDate as string | number | Date),
    (((allocation.payments as Record<string, unknown>[]) || []).map(p => ({ amount: (p as Record<string, unknown>).amount as number }))),
    (allocation.bed as Record<string, unknown>)?.pricePerDay as number || 0,
    new Date()
  );
  
  if (status.status === 'PENDING') {
    return {
      canDeallocate: true,
      warning: `Student has pending fees of NPR ${status.remainingBalance.toFixed(2)}. This amount will remain on record.`
    };
  }
  
  return {
    canDeallocate: true
  };
}

// ============================================================================
// Example 7: Calculate total pending across all allocations
// ============================================================================
export function calculateTotalPending(allocations: Record<string, unknown>[]): number {
  return allocations.reduce((total, allocation) => {
    const status = calculatePaymentStatus(
      new Date(allocation.allocationDate as string | number | Date),
      (((allocation.payments as Record<string, unknown>[]) || []).map(p => ({ amount: (p as Record<string, unknown>).amount as number }))),
      (allocation.bed as Record<string, unknown>)?.pricePerDay as number || 0,
      new Date()
    );
    
    return total + status.remainingBalance;
  }, 0);
}

// ============================================================================
// Example 8: Get financial summary for a student
// ============================================================================
export function getStudentFinancialSummary(allocations: Record<string, unknown>[]) {
  let totalOwed = 0;
  let totalPaid = 0;
  let totalPending = 0;
  let totalCredit = 0;
  
  allocations.forEach(allocation => {
    const status = calculatePaymentStatus(
      new Date(allocation.allocationDate as string | number | Date),
      (((allocation.payments as Record<string, unknown>[]) || []).map(p => ({ amount: (p as Record<string, unknown>).amount as number }))),
      (allocation.bed as Record<string, unknown>)?.pricePerDay as number || 0,
      new Date()
    );
    
    totalOwed += status.totalAmountOwed;
    totalPaid += status.totalAmountPaid;
    totalPending += status.remainingBalance;
    totalCredit += status.creditBalance;
  });
  
  return {
    totalOwed,
    totalPaid,
    totalPending,
    totalCredit,
    finalBalance: totalPending - totalCredit
  };
}
