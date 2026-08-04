export const dynamic = "force-dynamic";

import BillList from "@/features/admin/inventory/billing/components/BillList";
import { Separator } from "@/features/core/components/separator";

export default async function BillingPage() {
    return (
        <div className="p-6 flex flex-col gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Billing and Expenses</h1>
                <p className="text-muted-foreground">
                    Manage utility bills and other inventory-related expenses.
                </p>
            </div>
            <Separator />
            <BillList isAdmin={true} />
        </div>
    );
}
