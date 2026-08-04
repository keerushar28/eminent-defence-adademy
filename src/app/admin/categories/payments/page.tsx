import PaymentDataTable from "@/features/admin/payments/components/payment-data-table";

export default function PaymentPage() {
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
            </div>
            <PaymentDataTable />
        </div>
    )
}