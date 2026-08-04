"use client";

import StudentLedger from "@/features/admin/students/ledger/components/StudentLedger";

export default function LedgerPage() {
    return (
        <div className="p-4 flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold">Ledger Management</h1>
                    <p className="text-muted-foreground">
                        View all payments history, and filter, categorize all of the history
                    </p>
                </div>
            </div>
            <StudentLedger />
        </div>
    );
}