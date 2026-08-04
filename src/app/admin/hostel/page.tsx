"use client";

import Hostel from "@/features/admin/hostel/overview/components/Hostel";
import { HostelErrorBoundary } from "@/features/admin/hostel/components/ErrorBoundary";


export default function HostelPage() {
    return (
        <HostelErrorBoundary>
            <div className="p-6 flex flex-col gap-8">
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                        <div>
                            <h1 className="text-2xl font-bold">Hostel Management</h1>
                            <p className="text-sm text-muted-foreground">
                                Manage rooms, beds, allocations, and billing
                            </p>
                        </div>
                    </div>
                </div>
                <Hostel />
            </div>
        </HostelErrorBoundary>
    );
}