"use client";

import ExpenseLedger from "@/features/admin/ledger/components/ExpenseLedger";

export default function ExpenseLedgerPage() {
  return (
    <div className="p-6 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Expense Ledger</h1>
          <p className="text-sm text-muted-foreground">
            Track all utility bills and inventory expenses with comprehensive analytics
          </p>
        </div>
      </div>
      <ExpenseLedger />
    </div>
  );
}
