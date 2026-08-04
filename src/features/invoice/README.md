# Invoice Module

This module is a standalone invoice generation system that is completely independent and not connected to any other modules in the application.

## Features

- Generate student invoices in PDF format
- Customizable invoice sections:
  - Category Payments
  - Inventory Issuances
  - Hostel Payments
  - Hostel Allocations Information
- Professional invoice layout with company branding
- Support for Nepali currency (₹)
- Dark mode support

## Structure

```
src/features/invoice/
├── types/
│   └── invoice.ts          # Type definitions
├── actions/
│   └── invoice-actions.ts  # Server actions for data fetching
├── lib/
│   └── pdf-generator.ts    # PDF HTML generation
├── components/
│   └── InvoiceGenerator.tsx # Main invoice UI component
└── README.md
```

## Usage

### Basic Usage

```tsx
import { InvoiceGenerator } from "@/features/invoice/components/InvoiceGenerator";

export default function MyPage() {
  return (
    <InvoiceGenerator
      studentId="student-123"
      studentName="John Doe"
    />
  );
}
```

### Invoice Options

The invoice can include the following sections:

- `includeCategoryPayments`: Include category and sub-category payments
- `includeInventoryIssuances`: Include issued items with payment status
- `includeHostelPayments`: Include hostel accommodation payments
- `includeAllocationsInfo`: Include hostel allocation details

## Data Flow

1. User selects a student
2. User chooses which sections to include in the invoice
3. `getStudentInvoiceData()` fetches all relevant data from the database
4. `generateInvoicePDF()` creates HTML content for the invoice
5. `html2pdf` library converts HTML to PDF
6. PDF is downloaded to the user's device

## Dependencies

- `html2pdf.js`: For converting HTML to PDF
- `date-fns`: For date formatting
- `@prisma/client`: For database queries

## Notes

- This module is completely independent and can be used in any part of the application
- All database queries are server-side for security
- PDF generation happens on the client-side for better performance
- The invoice layout is responsive and print-friendly
