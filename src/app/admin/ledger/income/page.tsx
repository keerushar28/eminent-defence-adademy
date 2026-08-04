"use client";

import MainLedger from "@/features/admin/ledger/components/MainLedger";

export default function IncomeLedgerPage() {
  return (
    <div className="p-6 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Income Ledger</h1>
          <p className="text-sm text-muted-foreground">
            Unified view of all income payments from students and hostel with comprehensive analytics
          </p>
        </div>
      </div>
      <MainLedger />
    </div>
  );
}
