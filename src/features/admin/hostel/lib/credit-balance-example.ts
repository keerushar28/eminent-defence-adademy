/**
 * Credit Balance Examples and Usage
 * 
 * This file demonstrates how the credit balance system works
 * in the hostel payment management.
 */

/**
 * Example 1: Initial Allocation with Partial Payment
 * 
 * Scenario:
 * - Student allocated on Nov 1
 * - Price per day: NPR 500
 * - Initial payment: NPR 700
 * 
 * Calculation:
 * - Days purchased: floor(700 / 500) = 1 day
 * - Credit balance: 700 - (1 × 500) = NPR 200
 * - paidUntil: Nov 1
 * 
 * Result:
 * - Student has paid for Nov 1
 * - NPR 200 credit balance stored for future use
 */
export function example1_InitialPartialPayment() {
  const allocationDate = new Date('2024-11-01');
  const pricePerDay = 500;
  const initialPayment = 700;
  
  const daysPurchased = Math.floor(initialPayment / pricePerDay); // 1
  const creditBalance = initialPayment - (daysPurchased * pricePerDay); // 200
  
  const paidUntil = new Date(allocationDate);
  paidUntil.setDate(paidUntil.getDate() + daysPurchased - 1); // Nov 1
  
  return {
    allocationDate,
    paidUntil,
    creditBalance,
    daysPurchased,
    message: `Paid for ${daysPurchased} day(s). Credit balance: NPR ${creditBalance}`
  };
}

/**
 * Example 2: Second Payment Using Credit Balance
 * 
 * Scenario:
 * - Current paidUntil: Nov 1
 * - Current creditBalance: NPR 200
 * - New payment: NPR 500
 * - Price per day: NPR 500
 * 
 * Calculation:
 * - Total available: 200 + 500 = NPR 700
 * - Days purchased: floor(700 / 500) = 1 day
 * - New credit balance: 700 - (1 × 500) = NPR 200
 * - New paidUntil: Nov 2
 * 
 * Result:
 * - Student now paid until Nov 2
 * - Still has NPR 200 credit balance
 */
export function example2_SecondPaymentWithCredit() {
  const currentPaidUntil = new Date('2024-11-01');
  const currentCreditBalance = 200;
  const newPayment = 500;
  const pricePerDay = 500;
  
  const totalAvailable = currentCreditBalance + newPayment; // 700
  const daysPurchased = Math.floor(totalAvailable / pricePerDay); // 1
  const newCreditBalance = totalAvailable - (daysPurchased * pricePerDay); // 200
  
  const newPaidUntil = new Date(currentPaidUntil);
  newPaidUntil.setDate(newPaidUntil.getDate() + daysPurchased); // Nov 2
  
  return {
    previousPaidUntil: currentPaidUntil,
    newPaidUntil,
    previousCreditBalance: currentCreditBalance,
    newCreditBalance,
    daysPurchased,
    message: `Paid for ${daysPurchased} more day(s). New credit balance: NPR ${newCreditBalance}`
  };
}

/**
 * Example 3: Payment Covering Multiple Days
 * 
 * Scenario:
 * - Current paidUntil: Nov 1
 * - Current creditBalance: NPR 200
 * - New payment: NPR 1300
 * - Price per day: NPR 500
 * 
 * Calculation:
 * - Total available: 200 + 1300 = NPR 1500
 * - Days purchased: floor(1500 / 500) = 3 days
 * - New credit balance: 1500 - (3 × 500) = NPR 0
 * - New paidUntil: Nov 4
 * 
 * Result:
 * - Student now paid until Nov 4
 * - No credit balance remaining
 */
export function example3_MultiDayPayment() {
  const currentPaidUntil = new Date('2024-11-01');
  const currentCreditBalance = 200;
  const newPayment = 1300;
  const pricePerDay = 500;
  
  const totalAvailable = currentCreditBalance + newPayment; // 1500
  const daysPurchased = Math.floor(totalAvailable / pricePerDay); // 3
  const newCreditBalance = totalAvailable - (daysPurchased * pricePerDay); // 0
  
  const newPaidUntil = new Date(currentPaidUntil);
  newPaidUntil.setDate(newPaidUntil.getDate() + daysPurchased); // Nov 4
  
  return {
    previousPaidUntil: currentPaidUntil,
    newPaidUntil,
    previousCreditBalance: currentCreditBalance,
    newCreditBalance,
    daysPurchased,
    message: `Paid for ${daysPurchased} more day(s). Credit balance used up.`
  };
}

/**
 * Example 4: Small Payment Adding to Credit
 * 
 * Scenario:
 * - Current paidUntil: Nov 1
 * - Current creditBalance: NPR 200
 * - New payment: NPR 100
 * - Price per day: NPR 500
 * 
 * Calculation:
 * - Total available: 200 + 100 = NPR 300
 * - Days purchased: floor(300 / 500) = 0 days
 * - New credit balance: 300 - (0 × 500) = NPR 300
 * - paidUntil: Nov 1 (unchanged)
 * 
 * Result:
 * - paidUntil remains Nov 1
 * - Credit balance increased to NPR 300
 */
export function example4_SmallPaymentAddingToCredit() {
  const currentPaidUntil = new Date('2024-11-01');
  const currentCreditBalance = 200;
  const newPayment = 100;
  const pricePerDay = 500;
  
  const totalAvailable = currentCreditBalance + newPayment; // 300
  const daysPurchased = Math.floor(totalAvailable / pricePerDay); // 0
  const newCreditBalance = totalAvailable - (daysPurchased * pricePerDay); // 300
  
  const newPaidUntil = new Date(currentPaidUntil);
  newPaidUntil.setDate(newPaidUntil.getDate() + daysPurchased); // Nov 1 (no change)
  
  return {
    previousPaidUntil: currentPaidUntil,
    newPaidUntil,
    previousCreditBalance: currentCreditBalance,
    newCreditBalance,
    daysPurchased,
    message: `Payment added to credit. No new days purchased. Credit balance: NPR ${newCreditBalance}`
  };
}

/**
 * Example 5: Checking Current Status
 * 
 * How to determine if student has pending fees or credit:
 */
export function example5_CheckCurrentStatus() {
  const allocationDate = new Date('2024-11-01');
  const paidUntil = new Date('2024-11-03');
  const creditBalance = 200;
  const currentDate = new Date('2024-11-05');
  const pricePerDay = 500;
  
  // Calculate days stayed
  const daysStayed = Math.floor(
    (currentDate.getTime() - allocationDate.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1; // 5 days (Nov 1-5)
  
  // Calculate days paid
  const daysPaid = Math.floor(
    (paidUntil.getTime() - allocationDate.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1; // 3 days (Nov 1-3)
  
  // Calculate pending days
  const pendingDays = daysStayed - daysPaid; // 2 days (Nov 4-5)
  
  // Calculate pending amount
  const pendingAmount = pendingDays * pricePerDay; // 1000
  
  // Net balance (pending - credit)
  const netBalance = pendingAmount - creditBalance; // 800
  
  return {
    daysStayed,
    daysPaid,
    pendingDays,
    pendingAmount,
    creditBalance,
    netBalance,
    status: netBalance > 0 ? 'PENDING' : netBalance < 0 ? 'OVERPAID' : 'UP_TO_DATE',
    message: netBalance > 0 
      ? `Student owes NPR ${netBalance} (NPR ${pendingAmount} pending - NPR ${creditBalance} credit)`
      : netBalance < 0
      ? `Student has NPR ${Math.abs(netBalance)} credit`
      : 'Student is paid up'
  };
}

/**
 * Visual Timeline Example
 * 
 * Nov 1: Allocated, paid NPR 700 (1 day + NPR 200 credit)
 * ├─ Paid: Nov 1
 * └─ Credit: NPR 200
 * 
 * Nov 2: Stayed (unpaid)
 * ├─ Paid: Nov 1
 * ├─ Pending: Nov 2 (NPR 500)
 * └─ Credit: NPR 200
 * 
 * Nov 3: Paid NPR 500
 * ├─ Total: NPR 200 + NPR 500 = NPR 700
 * ├─ Days: 1 day
 * ├─ Paid: Nov 2
 * └─ Credit: NPR 200
 * 
 * Nov 4: Stayed (unpaid)
 * ├─ Paid: Nov 2
 * ├─ Pending: Nov 3-4 (NPR 1000)
 * └─ Credit: NPR 200
 * 
 * Nov 5: Paid NPR 1300
 * ├─ Total: NPR 200 + NPR 1300 = NPR 1500
 * ├─ Days: 3 days
 * ├─ Paid: Nov 5
 * └─ Credit: NPR 0
 */
