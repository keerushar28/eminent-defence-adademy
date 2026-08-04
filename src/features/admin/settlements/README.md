# Payment Approval & Supervision System

A comprehensive payment approval and supervision system for tracking and managing payment approvals across categories, hostel, and inventory issuances.

## Overview

This system works as a **supervision/approval workflow** where:

1. **Staff records payments** (in other parts of the system - categories, hostel, inventory)
2. **Admin/Supervisor approves payments** (this settlements system)
3. **Settlement = Approval** - marking that a payment has been verified and approved by a supervisor

## Features

### 📊 Approval Statistics
- **Total Collected**: Sum of all payments across all categories
- **Total Approved**: Amount that has been approved by supervisors
- **Pending Approval**: Outstanding amount waiting for supervisor approval
- **Approval Rate**: Percentage of payments that have been approved

### 💳 Payment Approval Management
- View all payments from categories, hostel, and inventory issuances in a unified table
- Filter by payment type (Category, Hostel, Issuance)
- Filter by approval status (Approved, Pending Approval)
- Search by student name, email, or category
- Sort by date, amount, or student name
- Bulk selection for batch approval
- Pagination for large datasets

### ✅ Payment Approval Process
- **Individual Approval**: Click actions menu to approve single payments
- **Bulk Approval**: Select multiple payments for batch approval
- **Approval Notes**: Add optional notes when approving payments
- **Automatic User Tracking**: System automatically records which supervisor approved payments
- **Real-time Validation**: Prevents duplicate approvals

### 🔧 Individual Payment Management
- **Actions Menu**: Three-dot menu on each payment row
- **Approve Payment**: Mark individual payments as approved with optional notes
- **Revoke Approval**: Revert approved payments back to pending status
- **Approval Details**: View who approved the payment and when
- **Smart Approval Handling**: 
  - Creates approval records for individual payments
  - Removes payments from approval batches when revoking
  - Deletes approval records if they become empty
  - Updates approval amounts when payments are removed

### 📋 Payment Approval Tracking
- View approval statistics in the stats cards
- Filter payments by approval status (Approved/Pending Approval)
- Search and sort through all payment records
- Individual payment details show approval information
- Audit trail maintained automatically

## Architecture

### Feature-First Structure
```
src/features/admin/settlements/
├── actions/
│   └── settlement-actions.ts    # Server actions for data operations
├── components/
│   ├── settlement-stats-cards.tsx
│   ├── payments-data-table.tsx
│   ├── settlements-page-client.tsx
│   └── payment-settlement-dialog.tsx  # Individual payment management
├── hooks/
│   └── use-settlements.ts       # Client-side state management
├── types/
│   └── index.ts                 # TypeScript type definitions
├── index.ts                     # Feature exports
└── README.md                    # This file
```

### Server Components
- Main page uses Next.js Server Components for initial data loading
- Suspense boundaries for loading states
- Server actions for approval operations

### Client Components
- Interactive table with filtering and sorting
- Real-time approval creation
- Optimistic updates for better UX

## Usage

### Basic Implementation
```tsx
import { SettlementsPageClient } from "@/features/admin/settlements";

// Server component
async function ApprovalsPage() {
  const [stats, payments, approvals] = await Promise.all([
    getSettlementStats(),
    getAllPaymentsPaginated(),
    getSettlements(),
  ]);

  return (
    <SettlementsPageClient
      initialStats={stats}
      initialPayments={payments.payments}
      // ... other props
    />
  );
}
```

### Using the Hook
```tsx
import { useSettlements } from "@/features/admin/settlements";

function MyComponent() {
  const {
    stats,
    payments,
    settlements,
    fetchPayments,
    createNewSettlement, // This creates approval batches
    isLoading,
  } = useSettlements();

  // Use the hook methods...
}
```

## API Routes

### GET `/api/admin/settlements`
Query parameters:
- `action=stats` - Get approval statistics
- `action=payments` - Get paginated payments with filters

### POST `/api/admin/settlements`
Create a new approval batch with selected payments.
Body:
- `paymentIds` - Array of payment IDs to approve
- `notes` - Optional approval notes

### GET `/api/admin/settlements/[paymentId]`
Get details of a specific payment including approval information.
Query parameters:
- `type` - Payment type (CATEGORY, HOSTEL, ISSUANCE)

### PATCH `/api/admin/settlements/[paymentId]`
Update the approval status of an individual payment.
Body:
- `paymentType` - Payment type (CATEGORY, HOSTEL, ISSUANCE)
- `isSettled` - Boolean indicating approval status
- `settlementDetails` - Optional approval details (notes)

## Database Schema

The feature works with these Prisma models:
- `Settlement` - Main approval records (represents supervisor approval batches)
- `CategoryPayment` - Category fee payments
- `HostelPayment` - Hostel accommodation payments  
- `IssuancePayment` - Inventory issuance payments

Each payment type can be linked to an approval record via `settlementId`.

## Performance Optimizations

1. **Pagination**: All data tables use server-side pagination
2. **Parallel Queries**: Initial data is fetched in parallel
3. **Optimistic Updates**: UI updates immediately on actions
4. **Lazy Loading**: Components are loaded on demand
5. **Memoization**: Expensive calculations are memoized

## Security

- Server actions validate all inputs and authenticate users
- Payment eligibility is checked before approval
- User authentication required for all operations
- Audit trail maintained for all approvals with supervisor tracking

## Workflow

1. **Staff records payment** → Payment created with `settlementId: null` (pending approval)
2. **Supervisor reviews payment** → Views payment in settlements/approvals page
3. **Supervisor approves payment** → Creates Settlement record, links payment via `settlementId`
4. **Payment is now approved** → Shows as "Approved" with supervisor details

This creates a clear supervision workflow where all payments must be approved by supervisors before being considered finalized.

## Future Enhancements

- [ ] Export settlements to PDF/Excel
- [ ] Email notifications for settlements
- [ ] Settlement approval workflow
- [ ] Advanced reporting and analytics
- [ ] Integration with accounting systems
- [ ] Bulk status updates with filters
- [ ] Settlement reversal with audit trail