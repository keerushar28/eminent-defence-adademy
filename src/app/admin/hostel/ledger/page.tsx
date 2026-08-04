"use client";

import HostelLedger from "@/features/admin/hostel/ledger/components/Ledger";

export default function LedgerPage() {
    return (
        <div className="p-6 flex flex-col gap-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold">Hostel Ledger Management</h1>
                    <p className="text-sm text-muted-foreground">
                        View hostel payments, room allocations, and track student payment status
                    </p>
                </div>
            </div>
            <HostelLedger />
        </div>
    );
}