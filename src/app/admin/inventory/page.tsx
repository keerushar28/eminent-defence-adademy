export const dynamic = 'force-dynamic'; // Add this line

import { getDashboardStats } from "@/features/admin/inventory/actions/item-actions";
import InventoryDashboard from "@/features/admin/inventory/components/shared/InventoryDashboard";

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
            </div>

            {/* Dashboard */}
            <InventoryDashboard stats={stats} />
        </div>
    );
}