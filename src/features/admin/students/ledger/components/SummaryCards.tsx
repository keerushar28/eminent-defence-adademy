import { Card, CardContent, CardHeader, CardTitle } from "@/features/core/components/card";
import { formatCurrency } from "../utils/utils";

interface ISummaryCardsProps {
    summary: {
        totalStudents: number;
        fullyPaid: number;
        pending: number;
        unpaid: number;
        noAllocation: number;
        totalFeesCollected: number;
        totalPendingFees: number;
    }
}
export default function SummaryCards({ summary }: ISummaryCardsProps) {
    return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-xl font-bold">{summary.totalStudents}</div>
                <div className="flex items-center gap-2 mt-2 text-xs flex-wrap">
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                        {summary.fullyPaid} Paid
                    </span>
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full font-medium">
                        {summary.pending} Pending
                    </span>
                    <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded-full font-medium">
                        {summary.unpaid} Unpaid
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full font-medium">
                        {summary.noAllocation} No Alloc
                    </span>
                </div>
            </CardContent>
        </Card>

        <Card className="border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-emerald-700">
                    Total Collected
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-emerald-700">
                    {formatCurrency(summary.totalFeesCollected)}
                </div>
                <p className="text-xs text-emerald-600 mt-2">
                    Total fees collected from all students
                </p>
            </CardContent>
        </Card>

        <Card className="border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-rose-700">
                    Pending Fees
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-rose-700">
                    {formatCurrency(summary.totalPendingFees)}
                </div>
                <p className="text-xs text-rose-600 mt-2">
                    Total outstanding payments
                </p>
            </CardContent>
        </Card>

        <Card className="border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-700">
                    Collection Rate
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-purple-700">
                    {summary.totalFeesCollected + summary.totalPendingFees > 0
                        ? (
                            (summary.totalFeesCollected /
                                (summary.totalFeesCollected + summary.totalPendingFees)) *
                            100
                        ).toFixed(1)
                        : 0}
                    %
                </div>
                <div className="mt-2 h-2 bg-purple-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-purple-600 transition-all"
                        style={{
                            width: `${summary.totalFeesCollected + summary.totalPendingFees > 0
                                ? (
                                    (summary.totalFeesCollected /
                                        (summary.totalFeesCollected +
                                            summary.totalPendingFees)) *
                                    100
                                ).toFixed(1)
                                : 0
                                }%`,
                        }}
                    />
                </div>
            </CardContent>
        </Card>
    </div>
}