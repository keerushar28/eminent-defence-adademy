"use client";

import { useState } from "react";
import AllocationManagement from "@/features/admin/hostel/allocations/components/AllocationManagement";
import type { ExportOptions } from "@/lib/export-utils";

export default function AllocationsPage() {
    const [exportOptions, setExportOptions] = useState<ExportOptions | null>(null);

    return (
        <AllocationManagement
            exportOptions={exportOptions}
            onExportOptionsChange={setExportOptions}
        />
    );
}