/**
 * Billing Calculation Utilities for Hostel Management
 *
 * This module provides calculation functions for hostel billing operations
 * including pending fees, overpayments, and payment processing.
 */

/**
 * Payment Status Types
 */
export type PaymentStatus = "PENDING" | "OVERPAID" | "UP_TO_DATE";

export interface PaymentStatusResult {
  status: PaymentStatus;
  totalDaysStayed: number;
  totalAmountOwed: number;
  totalAmountPaid: number;
  remainingBalance: number;
  creditBalance: number;
  daysStayed: number;
  daysPaid: number;
  pricePerDay: number;
  message: string;
}

/**
 * Calculate total payable days from allocation date to current date
 *
 * @param allocationDate - The date when the allocation started
 * @param currentDate - The current date (or reference date for calculation)
 * @returns Number of days from allocation to current date
 *
 * Requirements: 4.1
 */
export function calculateTotalPayableDays(
  allocationDate: Date,
  currentDate: Date
): number {
  const timeDiff = toUtcMidnight(currentDate).getTime() - toUtcMidnight(allocationDate).getTime();
  return Math.round(timeDiff / (1000 * 60 * 60 * 24));
}

/**
 * Calculate pending days (days after paidUntil date)
 * Returns 0 if current date is on or before paidUntil date
 *
 * Edge case handling:
 * - If allocationDate === paidUntil (no payment made yet), includes the allocation date itself
 * - If allocationDate !== paidUntil (payment already made), starts from day after paidUntil
 *
 * @param paidUntil - The date until which payment has been made
 * @param currentDate - The current date (or reference date for calculation)
 * @param allocationDate - The date when the allocation started (optional, for edge case handling)
 * @returns Number of days pending payment
 *
 * Requirements: 4.2
 */
export function toUtcMidnight(date: Date): Date {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
}

export function calculatePendingDays(
  paidUntil: Date,
  currentDate: Date,
  allocationDate?: Date
): number {
  // Normalize all dates to UTC midnight to avoid timezone/time-component issues
  const paidUntilNorm = toUtcMidnight(paidUntil);
  const currentNorm = toUtcMidnight(currentDate);
  const allocationNorm = allocationDate ? toUtcMidnight(allocationDate) : undefined;

  if (currentNorm <= paidUntilNorm) {
    return 0;
  }

  const timeDiff = currentNorm.getTime() - paidUntilNorm.getTime();
  return Math.round(timeDiff / (1000 * 60 * 60 * 24));
}
/**
 * Calculate overpaid days (days before current date that are already paid)
 * Returns 0 if paidUntil is on or before current date
 *
 * @param paidUntil - The date until which payment has been made
 * @param currentDate - The current date (or reference date for calculation)
 * @returns Number of days overpaid
 *
 * Requirements: 4.4
 */
export function calculateOverpaidDays(
  paidUntil: Date,
  currentDate: Date
): number {
  if (paidUntil <= currentDate) {
    return 0;
  }
  const timeDiff = paidUntil.getTime() - currentDate.getTime();
  return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
}

/**
 * Calculate overpaid amount based on actual payments vs consumed days
 * This is the correct method when you have actual payment records
 *
 * Formula: Overpaid = Total Paid - (Days Consumed × Daily Rate)
 * Where Days Consumed = Current Date - Allocation Date (exclusive of current date)
 *
 * @param allocationDate - The date when the allocation started
 * @param currentDate - The current date (or reference date for calculation)
 * @param totalPaid - Total amount paid by the student
 * @param pricePerDay - Daily rate for the bed
 * @returns Overpaid amount (0 if not overpaid)
 *
 * Requirements: 4.4, 4.5
 */
export function calculateOverpaidAmount(
  allocationDate: Date,
  currentDate: Date,
  totalPaid: number,
  pricePerDay: number
): number {
  // Calculate days consumed (from allocation date to current date, exclusive)
  const daysConsumed = calculateTotalPayableDays(allocationDate, currentDate);

  // Calculate amount for consumed days
  const amountConsumed = daysConsumed * pricePerDay;

  // Calculate overpaid amount
  const overpaid = totalPaid - amountConsumed;

  // Return 0 if not overpaid (student owes money or is up to date)
  return overpaid > 0 ? overpaid : 0;
}

/**
 * Calculate pending amount based on pending days and daily rate
 *
 * @param pendingDays - Number of days pending payment
 * @param pricePerDay - Daily rate for the bed
 * @returns Total pending amount
 *
 * Requirements: 4.3
 */
export function calculatePendingAmount(
  pendingDays: number,
  pricePerDay: number
): number {
  return pendingDays * pricePerDay;
}

/**
 * Calculate credit amount based on overpaid days and daily rate
 *
 * @param overpaidDays - Number of days overpaid
 * @param pricePerDay - Daily rate for the bed
 * @returns Total credit amount
 *
 * Requirements: 4.5
 */
export function calculateCreditAmount(
  overpaidDays: number,
  pricePerDay: number
): number {
  return overpaidDays * pricePerDay;
}

/**
 * Calculate days purchased from payment amount
 * Uses floor division to get complete days only
 *
 * @param amount - Payment amount
 * @param pricePerDay - Daily rate for the bed
 * @returns Number of complete days purchased
 *
 * Requirements: 5.2
 */
export function calculateDaysPurchased(
  amount: number,
  pricePerDay: number
): number {
  if (pricePerDay <= 0) {
    throw new Error("Price per day must be greater than zero");
  }
  return Math.floor(amount / pricePerDay);
}

/**
 * Calculate new paid until date after payment
 * Adds the purchased days to the current paid until date
 *
 * @param currentPaidUntil - Current paid until date
 * @param daysPurchased - Number of days purchased with the payment
 * @returns New paid until date
 *
 * Requirements: 5.3
 */
export function calculateNewPaidUntil(
  currentPaidUntil: Date,
  daysPurchased: number
): Date {
  const newDate = new Date(currentPaidUntil);
  newDate.setDate(newDate.getDate() + daysPurchased);
  return newDate;
}

/**
 * Calculate comprehensive billing information for an allocation
 * This is a convenience function that combines multiple calculations
 *
 * @param allocationDate - The date when the allocation started
 * @param paidUntil - The date until which payment has been made
 * @param pricePerDay - Daily rate for the bed
 * @param currentDate - The current date (defaults to now)
 * @returns Object containing all billing calculations
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8
 */
export function calculateCompleteBilling(
  allocationDate: Date,
  paidUntil: Date,
  pricePerDay: number,
  currentDate: Date = new Date()
) {
  const totalPayableDays = calculateTotalPayableDays(
    allocationDate,
    currentDate
  );
  const pendingDays = calculatePendingDays(
    paidUntil,
    currentDate,
    allocationDate
  );
  const pendingAmount = calculatePendingAmount(pendingDays, pricePerDay);
  const overpaidDays = calculateOverpaidDays(paidUntil, currentDate);
  const creditAmount = calculateCreditAmount(overpaidDays, pricePerDay);

  return {
    totalPayableDays,
    pendingDays,
    pendingAmount,
    overpaidDays,
    creditAmount,
    pricePerDay,
  };
}

/**
 * Calculate comprehensive payment status for an allocation
 *
 * This function calculates the complete payment status including:
 * - Total days stayed (from allocation date to current date)
 * - Total amount owed (days stayed × price per day)
 * - Total amount paid (sum of all payments)
 * - Remaining balance (amount owed - amount paid)
 * - Payment status (PENDING, OVERPAID, or UP_TO_DATE)
 *
 * Example:
 * - Student allocated on Oct 18, stayed 5 days, price = NPR 500/day
 * - Total owed = 5 × 500 = NPR 2500
 * - Paid = NPR 750
 * - Remaining = NPR 2500 - NPR 750 = NPR 1750 (PENDING)
 *
 * @param allocationDate - The date when the allocation started
 * @param payments - Array of payment objects with amount field
 * @param pricePerDay - Daily rate for the bed
 * @param currentDate - The current date (defaults to now)
 * @returns PaymentStatusResult with complete payment information
 */
export function calculatePaymentStatus(
  allocationDate: Date,
  payments: Array<{ amount: number }>,
  pricePerDay: number,
  currentDate: Date = new Date()
): PaymentStatusResult {
  // Calculate total days stayed (from allocation date to current date, inclusive)
  const timeDiff = currentDate.getTime() - allocationDate.getTime();
  const totalDaysStayed = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1; // +1 to include allocation day

  // Calculate total amount owed
  const totalAmountOwed = totalDaysStayed * pricePerDay;

  // Calculate total amount paid
  const totalAmountPaid = payments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );

  // Calculate remaining balance (positive = pending, negative = overpaid)
  const balance = totalAmountOwed - totalAmountPaid;

  // Calculate days paid
  const daysPaid = Math.floor(totalAmountPaid / pricePerDay);

  // Determine status and prepare result
  let status: PaymentStatus;
  let remainingBalance = 0;
  let creditBalance = 0;
  let message = "";

  if (balance > 0) {
    // Student owes money
    status = "PENDING";
    remainingBalance = balance;
    const pendingDays = Math.ceil(balance / pricePerDay);
    message = `Pending payment of NPR ${balance.toFixed(
      2
    )} for ${pendingDays} day(s)`;
  } else if (balance < 0) {
    // Student has overpaid
    status = "OVERPAID";
    creditBalance = Math.abs(balance);
    const creditDays = Math.floor(creditBalance / pricePerDay);
    message = `Credit balance of NPR ${creditBalance.toFixed(
      2
    )} (${creditDays} day(s) advance)`;
  } else {
    // Fully paid
    status = "UP_TO_DATE";
    message = "Payment is up to date";
  }

  return {
    status,
    totalDaysStayed,
    totalAmountOwed,
    totalAmountPaid,
    remainingBalance,
    creditBalance,
    daysStayed: totalDaysStayed,
    daysPaid,
    pricePerDay,
    message,
  };
}

/**
 * Calculate payment status using allocation and paidUntil dates
 * This is an alternative approach that uses the paidUntil date instead of payment records
 *
 * @param allocationDate - The date when the allocation started
 * @param paidUntil - The date until which payment has been made
 * @param pricePerDay - Daily rate for the bed
 * @param currentDate - The current date (defaults to now)
 * @returns PaymentStatusResult with complete payment information
 */
export function calculatePaymentStatusFromDates(
  allocationDate: Date,
  paidUntil: Date,
  pricePerDay: number,
  currentDate: Date = new Date()
): PaymentStatusResult {
  // Calculate total days stayed (from allocation date to current date, inclusive)
  const timeDiff = currentDate.getTime() - allocationDate.getTime();
  const totalDaysStayed = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1;

  // Calculate total amount owed
  const totalAmountOwed = totalDaysStayed * pricePerDay;

  // Calculate days paid (from allocation date to paidUntil, inclusive)
  const paidTimeDiff = paidUntil.getTime() - allocationDate.getTime();
  const daysPaid = Math.floor(paidTimeDiff / (1000 * 60 * 60 * 24)) + 1;

  // Calculate total amount paid
  const totalAmountPaid = daysPaid * pricePerDay;

  // Calculate remaining balance
  const balance = totalAmountOwed - totalAmountPaid;

  // Determine status
  let status: PaymentStatus;
  let remainingBalance = 0;
  let creditBalance = 0;
  let message = "";

  if (balance > 0) {
    status = "PENDING";
    remainingBalance = balance;
    const pendingDays = Math.ceil(balance / pricePerDay);
    message = `Pending payment of NPR ${balance.toFixed(
      2
    )} for ${pendingDays} day(s)`;
  } else if (balance < 0) {
    status = "OVERPAID";
    creditBalance = Math.abs(balance);
    const creditDays = Math.floor(creditBalance / pricePerDay);
    message = `Credit balance of NPR ${creditBalance.toFixed(
      2
    )} (${creditDays} day(s) advance)`;
  } else {
    status = "UP_TO_DATE";
    message = "Payment is up to date";
  }

  return {
    status,
    totalDaysStayed,
    totalAmountOwed,
    totalAmountPaid,
    remainingBalance,
    creditBalance,
    daysStayed: totalDaysStayed,
    daysPaid,
    pricePerDay,
    message,
  };
}
