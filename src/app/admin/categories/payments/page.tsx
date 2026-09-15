"use client";

import { useState } from "react";
import PaymentDataTable from "@/features/admin/payments/components/payment-data-table";
import { ExportButton } from "@/features/components/export-button";
import type { ExportOptions } from "@/lib/export-utils";

export default function PaymentPage() {
    const [exportOptions, setExportOptions] = useState<ExportOptions | null>(null);

    return (
        <div className="p-4 flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold">Payments Management</h1>
                    <p className="text-muted-foreground">
                        View all payments and add new payments for students
                    </p>
                </div>
                <ExportButton
                    options={exportOptions ?? { fileName: "payments", columns: [], data: [] }}
                    disabled={!exportOptions}
                />
            </div>
            <PaymentDataTable onExportOptionsChange={setExportOptions} />
        </div>
    )
}