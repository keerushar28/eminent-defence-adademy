"use client";

import { useState } from "react";
import StudentsDataTable from "@/features/admin/students/components/StudentsDataTable";
import { ExportButton } from "@/features/components/export-button";
import type { ExportOptions } from "@/lib/export-utils";

export const dynamic = "force-dynamic";

export default function StudentsPage() {
    const [exportOptions, setExportOptions] = useState<ExportOptions | null>(null);

    return (
        <div className="p-4 flex flex-col gap-4">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold">Students Management</h1>
                        <p className="text-muted-foreground">
                            Manage and oversee all student registrations, update records, review details, and ensure accurate information across the system.
                        </p>
                    </div>
                    <ExportButton
                        options={exportOptions ?? { fileName: "students", columns: [], data: [] }}
                        disabled={!exportOptions}
                    />
                </div>
            </div>

            <StudentsDataTable onExportOptionsChange={setExportOptions} />
        </div>
    );
} 