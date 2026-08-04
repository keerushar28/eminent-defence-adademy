"use client";

import { useState, useEffect } from "react";
import { DateRangeFilter } from "@/features/admin/ledger/types/expense";
import DateRangeFilterComponent from "@/features/admin/ledger/components/DateRangeFilter";
import { getOverallSummary } from "@/features/admin/ledger/actions/summary-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/core/components/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/core/components/table";
import { CategoryTree } from "@/features/admin/ledger/components/CategoryTree";
import { Loader2, Printer } from "lucide-react";
import { formatNepaliDateFromDate } from "@/features/core/lib/nepali-date";
import { cn } from "@/lib/utils";
import { Button } from "@/features/core/components/button";
import {
  type OverallSummaryData,
  formatAmount,
  printOverallSummary,
} from "@/features/admin/ledger/utils/overall-summary-print";

export default function OverallSummaryPage() {
  const [dateRange, setDateRange] = useState<DateRangeFilter>({ type: "ALL" });
  const [data, setData] = useState<OverallSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getOverallSummary(dateRange);
        setData(result);
      } catch (err) {
        console.error("Error fetching summary data:", err);
        setError("Failed to load summary data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dateRange]);

  const printDateLabel =
    dateRange.type === "CUSTOM" && dateRange.startDate && dateRange.endDate
      ? `${formatNepaliDateFromDate(dateRange.startDate)} – ${formatNepaliDateFromDate(dateRange.endDate)}`
      : "All Time";

  const handlePrint = () => {
    if (!data) return;
    printOverallSummary(data, printDateLabel);
  };

  return (
    <div className="p-4 flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Overall Summary</h1>
        <p className="text-muted-foreground">Comprehensive financial overview with category-wise breakdowns</p>
        <p className="text-sm text-blue-600 mt-1">
          Period:{" "}
          {dateRange.type === "CUSTOM" && dateRange.startDate && dateRange.endDate
            ? `${formatNepaliDateFromDate(dateRange.startDate)} – ${formatNepaliDateFromDate(dateRange.endDate)}`
            : "All Time"}
        </p>
      </div>

      {/* Filter + Print */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Filter by Date Range</h3>
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="flex-1">
              <DateRangeFilterComponent value={dateRange} onChange={setDateRange} />
            </div>
            <Button
              variant="outline"
              onClick={handlePrint}
              disabled={loading || !!error || !data}
              className="shrink-0 gap-2"
            >
              <Printer className="h-4 w-4" />
              Print Summary
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Tables */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading summary data...</span>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">{error}</div>
      ) : !data ? (
        <div className="text-center py-8 text-muted-foreground">No data available</div>
      ) : (
        <div className="grid gap-6">
          {/* Summary of Receive */}
          <Card>
            <CardHeader>
              <CardTitle>Summary of Receive</CardTitle>
              <p className="text-sm text-muted-foreground">Category-wise breakdown of all received payments</p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16 text-center">#</TableHead>
                    <TableHead className="min-w-0">Category</TableHead>
                    <TableHead className="text-right w-32">Amounts</TableHead>
                    <TableHead className="w-20 text-center">Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.categoryHierarchy.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No category payments found for the selected period
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      <CategoryTree
                        data={data.categoryHierarchy}
                        formatAmount={formatAmount}
                        prefix="Receive from"
                        startIndex={1}
                      />
                      {data.totals.totalIssuancePayments > 0 && (
                        <TableRow>
                          <TableCell className="w-16 text-center">{data.categoryHierarchy.length + 1}</TableCell>
                          <TableCell className="min-w-0">Receive from Inventory Issuances</TableCell>
                          <TableCell className="text-right font-mono w-32">
                            {formatAmount(data.totals.totalIssuancePayments)}
                          </TableCell>
                          <TableCell className="w-20 text-center">-</TableCell>
                        </TableRow>
                      )}
                      <TableRow className="font-semibold bg-muted/50 border-t-2">
                        <TableCell className="w-16" />
                        <TableCell className="font-bold min-w-0">Total Category Payment Receive</TableCell>
                        <TableCell className="text-right font-mono font-bold w-32">
                          {formatAmount(data.totals.totalCategoryReceive)}
                        </TableCell>
                        <TableCell className="w-20 text-center">-</TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Summary of Expenditure */}
          {data.expenditureBreakdown.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Summary of Expenditure</CardTitle>
                <p className="text-sm text-muted-foreground">Category-wise breakdown of all expenditures</p>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16 text-center">#</TableHead>
                      <TableHead className="min-w-0">Category</TableHead>
                      <TableHead className="text-right w-32">Amounts</TableHead>
                      <TableHead className="w-20 text-center">Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.expenditureBreakdown.map((item, index) => (
                      <TableRow key={item.name} className="hover:bg-muted/50">
                        <TableCell className="w-16 text-center">{index + 1}</TableCell>
                        <TableCell className="min-w-0">Expenditure from {item.name}</TableCell>
                        <TableCell className="text-right font-mono w-32">{formatAmount(item.amount)}</TableCell>
                        <TableCell className="w-20 text-center">-</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-semibold bg-muted/50 border-t-2">
                      <TableCell className="w-16" />
                      <TableCell className="font-bold min-w-0">Total Expenditure</TableCell>
                      <TableCell className="text-right font-mono font-bold w-32">
                        {formatAmount(data.totals.totalExpenditure)}
                      </TableCell>
                      <TableCell className="w-20 text-center">-</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Summary of Hostel Receive */}
          {data.hostelHierarchy.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Summary of Hostel Receive</CardTitle>
                <p className="text-sm text-muted-foreground">Category-wise breakdown of hostel payments received</p>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16 text-center">#</TableHead>
                      <TableHead className="min-w-0">Category</TableHead>
                      <TableHead className="text-right w-32">Amounts</TableHead>
                      <TableHead className="w-20 text-center">Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <CategoryTree
                      data={data.hostelHierarchy}
                      formatAmount={formatAmount}
                      prefix="Hostel Receive from"
                      startIndex={1}
                    />
                    <TableRow className="font-semibold bg-muted/50 border-t-2">
                      <TableCell className="w-16" />
                      <TableCell className="font-bold min-w-0">Total Hostel Receive</TableCell>
                      <TableCell className="text-right font-mono font-bold w-32">
                        {formatAmount(data.totals.totalHostelReceive)}
                      </TableCell>
                      <TableCell className="w-20 text-center">-</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Overall Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Overall Summary</CardTitle>
              <p className="text-sm text-muted-foreground">Final calculation of total receive vs expenditure</p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-0">Description</TableHead>
                    <TableHead className="text-right w-32">Amounts</TableHead>
                    <TableHead className="w-20 text-center">Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="min-w-0">Total Receive</TableCell>
                    <TableCell className="text-right font-mono w-32">{formatAmount(data.totals.totalReceive)}</TableCell>
                    <TableCell className="w-20 text-center">-</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="min-w-0">Total Expenditure</TableCell>
                    <TableCell className="text-right font-mono w-32">{formatAmount(data.totals.totalExpenditure)}</TableCell>
                    <TableCell className="w-20 text-center">-</TableCell>
                  </TableRow>
                  <TableRow className="font-semibold bg-muted/50 border-t-2">
                    <TableCell className="font-bold min-w-0">Remaining Balance</TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-mono font-bold w-32",
                        data.totals.remainingBalance >= 0 ? "text-green-600" : "text-red-600"
                      )}
                    >
                      {formatAmount(data.totals.remainingBalance)}
                    </TableCell>
                    <TableCell className="font-semibold w-20 text-center">
                      {data.totals.remainingBalance >= 0 ? "Profit" : "Loss"}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
