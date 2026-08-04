export const dynamic = 'force-dynamic'; // Add this line

import { getDashboardStats } from "@/features/admin/inventory/actions/item-actions";
import InventoryDashboard from "@/features/admin/inventory/components/shared/InventoryDashboard";
import { Button } from "@/features/core/components/button";
import { FileText } from "lucide-react";
import Link from "next/link";

export default async function InventoryPage() {
    const stats = await getDashboardStats();

    return (
        <div className="p-4 flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold">Inventory Management</h1>
                    <p className="text-muted-foreground">
                        Monitor and manage your inventory operations
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href="/admin/inventory/reports/expenses">
                        <Button variant="outline">
                            <FileText className="mr-2 h-4 w-4" />
                            Reports
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Dashboard */}
            <InventoryDashboard stats={stats} />
        </div>
    );
}