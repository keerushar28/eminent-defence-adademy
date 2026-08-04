# Hostel Management User Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Room Management](#room-management)
4. [Bed Management](#bed-management)
5. [Student Allocation](#student-allocation)
6. [Payment Management](#payment-management)
7. [Billing and Reports](#billing-and-reports)
8. [Common Workflows](#common-workflows)
9. [Troubleshooting](#troubleshooting)

---

## Introduction

The Hostel Management Module is a comprehensive system for managing hostel operations including rooms, beds, student allocations, daily-rate billing, and payment tracking. This guide will help you navigate and use all features effectively.

### Key Features

- **Room & Bed Management**: Create and organize hostel rooms and beds
- **Student Allocation**: Assign students to specific beds
- **Daily Rate Billing**: Automatic calculation of fees based on daily rates
- **Payment Tracking**: Record and track all payments
- **Financial History**: Complete historical records even after deallocation
- **Pending Fees**: Track outstanding dues across all students

---

## Getting Started

### Accessing the Hostel Module

1. Log in to the admin panel
2. Navigate to **Hostel** in the sidebar menu
3. You'll see the hostel overview dashboard

### Dashboard Overview

The dashboard displays:
- Total number of rooms
- Total beds (occupied and available)
- Active allocations
- Total pending fees
- Quick action buttons

---

## Room Management

### Creating a Room

1. Navigate to **Hostel > Rooms**
2. Click **Add Room** button
3. Fill in the room details:
   - **Room Number**: Unique identifier (e.g., "101", "A-201")
   - **Capacity**: Maximum number of beds allowed
   - **Default Bed Price**: Daily rate for beds in this room (₹)
   - **Description**: Optional notes about the room
4. Click **Create Room**

### Editing a Room

1. Find the room in the list
2. Click the **Edit** icon
3. Update the details
4. Click **Update Room**

### Deleting a Room

1. Find the room in the list
2. Click the **Delete** icon
3. Confirm deletion

**Note**: You cannot delete a room that has beds. Delete all beds first.

### Room List Features

- **Search**: Filter rooms by room number
- **Status Filter**: View active or inactive rooms
- **Bed Count**: See how many beds each room has
- **Occupancy**: View occupied vs. available beds

---

## Bed Management

### Creating a Bed

1. Navigate to **Hostel > Rooms**
2. Select a room or go to **Beds** section
3. Click **Add Bed**
4. Fill in the bed details:
   - **Room**: Select the room
   - **Bed Number**: Identifier within the room (e.g., "A", "1", "Upper-Left")
   - **Price Per Day**: Optional custom price (uses room default if not specified)
5. Click **Create Bed**

### Bed Status

Beds can have three statuses:
- **Available**: Ready for allocation
- **Allocated**: Currently assigned to a student
- **Inactive**: Temporarily unavailable (maintenance, etc.)

### Editing a Bed

1. Find the bed in the list
2. Click the **Edit** icon
3. Update details (number, price, status)
4. Click **Update Bed**

**Note**: You cannot change status to "Allocated" directly. Use the allocation process.

### Deleting a Bed

1. Find the bed in the list
2. Click the **Delete** icon
3. Confirm deletion

**Note**: You cannot delete an allocated bed. Deallocate the student first.

---

## Student Allocation

### Allocating a Student to a Bed

1. Navigate to **Hostel > Allocations**
2. Click **Allocate Student**
3. Follow the multi-step form:

   **Step 1: Select Student**
   - Search for the student by name or ID
   - Select the student

   **Step 2: Select Room**
   - Choose the room
   - View available beds in that room

   **Step 3: Select Bed**
   - Choose an available bed
   - View the daily rate

   **Step 4: Set Dates**
   - **Allocation Date**: When the student moves in
   - **Paid Until Date**: Date up to which payment is made
   - **Notes**: Optional information

4. Click **Allocate Student**

### Viewing Allocations

The allocation list shows:
- Student name
- Room and bed number
- Allocation date
- Paid until date
- Billing status (pending/paid/credit)
- Actions (view payments, deallocate)

### Filtering Allocations

- **Active Only**: Show current allocations
- **Inactive Only**: Show past allocations
- **All**: Show both active and inactive

### Deallocating a Student

1. Find the allocation in the list
2. Click **Deallocate**
3. Review the pending fees warning (if any)
4. Confirm deallocation

**Important**: 
- Deallocation proceeds even if fees are pending
- All data is preserved for historical records
- The bed becomes available for new allocation

---

## Payment Management

### Recording a Payment

1. Navigate to **Hostel > Payments**
2. Select the student's allocation from the dropdown
3. Click **Record Payment**
4. Fill in payment details:
   - **Amount**: Payment amount in ₹
   - **Payment Date**: When payment was received
   - **Payment Method**: Cash, UPI, Bank Transfer, etc.
   - **Reference Number**: Optional transaction reference
   - **Notes**: Optional payment notes
5. Review the calculated days purchased
6. Click **Record Payment**

### How Payment Calculation Works

- **Days Purchased** = Amount ÷ Daily Rate
- **New Paid Until Date** = Current Paid Until + Days Purchased

**Example**:
- Daily Rate: ₹150
- Payment Amount: ₹3,000
- Days Purchased: 20 days
- Current Paid Until: Jan 31
- New Paid Until: Feb 20

### Viewing Payment History

1. Select an allocation
2. View the payment history table showing:
   - Payment date
   - Amount paid
   - Days purchased
   - Updated paid until date
   - Payment method
   - Reference number

### Payment History Features

- **Sorting**: Sort by date, amount
- **Filtering**: Filter by date range
- **Export**: Download payment records (coming soon)

---

## Billing and Reports

### Understanding Billing Calculations

The system automatically calculates:

1. **Total Payable Days**: Days from allocation date to current date
2. **Pending Days**: Days after "paid until" date (if current date > paid until)
3. **Pending Amount**: Pending Days × Daily Rate
4. **Overpaid Days**: Days before current date that are paid (if paid until > current date)
5. **Credit Amount**: Overpaid Days × Daily Rate

### Viewing Pending Fees

1. Navigate to **Hostel > Billing**
2. View the pending fees table showing:
   - Student name
   - Room and bed
   - Pending days
   - Pending amount
   - Allocation status (active/inactive)

### Student Financial View

1. Navigate to **Hostel > Billing**
2. Search for a student
3. View complete financial summary:
   - All allocations (current and past)
   - Payment history
   - Total pending fees
   - Total credits
   - Final balance

### Billing Dashboard

The billing dashboard shows:
- **Total Pending Fees**: Across all students
- **Total Revenue**: All payments received
- **Active Allocations**: Current occupancy
- **Charts**: Visual representation of financial data

---

## Common Workflows

### Workflow 1: New Student Admission

1. Create room (if not exists)
2. Create beds in the room
3. Allocate student to a bed
4. Record initial payment
5. Monitor billing status

### Workflow 2: Monthly Payment Collection

1. Navigate to Billing > Pending Fees
2. Identify students with pending fees
3. Collect payment from student
4. Navigate to Payments
5. Select student's allocation
6. Record payment

### Workflow 3: Student Checkout

1. Navigate to Allocations
2. Find the student's allocation
3. Check for pending fees
4. Collect any outstanding dues
5. Record final payment (if any)
6. Click Deallocate
7. Confirm deallocation

### Workflow 4: Room Maintenance

1. Navigate to Beds
2. Find beds in the room
3. Change bed status to "Inactive"
4. Perform maintenance
5. Change status back to "Available"

### Workflow 5: End of Semester Cleanup

1. Review all active allocations
2. Identify students leaving
3. Collect pending fees
4. Deallocate students
5. Review financial reports
6. Prepare beds for next semester

---

## Troubleshooting

### Cannot Delete Room

**Problem**: Error when trying to delete a room

**Solution**: 
- Check if the room has beds
- Delete all beds first
- Then delete the room

### Cannot Delete Bed

**Problem**: Error when trying to delete a bed

**Solution**:
- Check if the bed is allocated
- Deallocate the student first
- Then delete the bed

### Cannot Allocate Student

**Problem**: Error when trying to allocate a student

**Possible Causes**:
1. Student already has an active allocation
   - Deallocate from current bed first
2. Bed is not available
   - Check bed status
   - Choose a different bed
3. Student doesn't exist in system
   - Add student to student management first

### Payment Not Updating Paid Until Date

**Problem**: Paid until date not changing after payment

**Solution**:
- Refresh the page
- Check if payment was recorded successfully
- Verify the allocation is active
- Contact support if issue persists

### Pending Fees Showing Incorrectly

**Problem**: Billing calculations seem wrong

**Check**:
1. Verify allocation date is correct
2. Verify paid until date is correct
3. Verify daily rate (bed price or room default)
4. Check all payments are recorded
5. Refresh the billing view

### Cannot See Deallocated Student's Records

**Problem**: Past allocation not visible

**Solution**:
- In Allocations, select "All" or "Inactive" filter
- In Billing, ensure "Include Inactive" is checked
- Use Allocation History view

---

## Best Practices

### Room and Bed Setup

- Use consistent naming conventions (e.g., "101", "102" for rooms)
- Use clear bed identifiers (e.g., "A", "B", "C" or "1", "2", "3")
- Set realistic room capacities
- Review and update prices regularly

### Allocation Management

- Always verify student details before allocation
- Set paid until date accurately
- Add notes for special cases
- Review allocations regularly

### Payment Collection

- Record payments promptly
- Always include payment method and reference
- Verify calculated days before confirming
- Keep payment receipts for reference

### Billing Monitoring

- Check pending fees weekly
- Send reminders to students with dues
- Review financial reports monthly
- Maintain accurate records

### Data Maintenance

- Don't delete historical data
- Use deallocation instead of deletion
- Keep notes for special cases
- Regular backups (handled by system)

---

## Tips and Shortcuts

- Use search to quickly find rooms, beds, or students
- Filter allocations by status for focused views
- Sort tables by clicking column headers
- Use the dashboard for quick overview
- Bookmark frequently used pages

---

## Support

If you encounter issues not covered in this guide:

1. Check the error message for specific details
2. Try refreshing the page
3. Clear browser cache if issues persist
4. Contact system administrator
5. Report bugs with screenshots and steps to reproduce

---

## Glossary

- **Allocation**: Assignment of a bed to a student
- **Deallocation**: Ending a student's bed assignment
- **Daily Rate**: Price charged per day for bed occupancy
- **Paid Until Date**: Date up to which student has paid
- **Pending Fees**: Amount owed for days after paid until date
- **Credit**: Overpayment when paid until is in the future
- **Active Allocation**: Current bed assignment
- **Inactive Allocation**: Past bed assignment (deallocated)

---

*Last Updated: November 2024*
