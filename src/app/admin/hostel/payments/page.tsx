import HostelPaymentDataTable from "@/features/admin/hostel/payments/components/hostel-payment-data-table";

export default function HostelPaymentPage() {
    return (
        <div className="p-4 flex flex-col gap-4">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-xl font-bold">Hostel Payments</h1>
                <p className="text-sm text-muted-foreground">
                    View and manage all hostel payments
                </p>
            </div>
            <HostelPaymentDataTable />
        </div>
    )
}
