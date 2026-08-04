"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/features/core/components/card";
import { ExpenseSummary } from "../types/expense";
import { TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ExpenseSummaryCardsProps {
  summary: ExpenseSummary;
}

export default function ExpenseSummaryCards({ summary }: ExpenseSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
      <Card className="border shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Expense</CardTitle>
          <div className="bg-red-50 p-2 rounded-lg">
            <TrendingDown className="h-4 w-4 text-red-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(summary.totalExpense, "NPR")}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
