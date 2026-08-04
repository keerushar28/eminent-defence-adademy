import IssuancePaymentsDataTable from "@/features/admin/inventory/issuances/IssuancePaymentsDataTable";

export default function IssuePaymentsPage() {
    return (
        <div className="p-4 flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold">Issuance Payments</h1>
                <p className="text-muted-foreground">
                    View all payments and add new payments for issued items
                </p>
            </div>
            <IssuancePaymentsDataTable />
        </div>
    );
}
