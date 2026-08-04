"use client";

import { ExpenseSummary } from "../types/expense";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/core/components/card";
import { formatCurrency } from "@/lib/utils";

interface ExpenseBreakdownChartProps {
  summary: ExpenseSummary;
}

export default function ExpenseBreakdownChart({ summary }: ExpenseBreakdownChartProps) {
  const getPercentage = (value: number, total: number) => {
    return total > 0 ? ((value / total) * 100).toFixed(1) : "0";
  };

  return (
    <Card className="border shadow-xs">
      <CardHeader>
        <CardTitle className="text-lg">Category-wise Expenses</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(summary.categoryBreakdown)
            .sort(([, a], [, b]) => b - a)
            .map(([category, amount]) => {
              const percentage = getPercentage(amount, summary.totalExpense);
              return (
                <div key={category}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{category}</span>
                    <span className="text-sm font-semibold">{formatCurrency(amount, "NPR")}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{percentage}%</p>
                </div>
              );
            })}
        </div>
      </CardContent>
    </Card>
  );
}
