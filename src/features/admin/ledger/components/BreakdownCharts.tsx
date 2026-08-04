"use client";

import { LedgerSummary } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/core/components/card";
import { formatCurrency } from "@/lib/utils";

interface BreakdownChartsProps {
  summary: LedgerSummary;
}

export default function BreakdownCharts({ summary }: BreakdownChartsProps) {
  const getPercentage = (value: number, total: number) => {
    return total > 0 ? ((value / total) * 100).toFixed(1) : "0";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Payment Method Breakdown */}
      <Card className="border shadow-xs">
        <CardHeader>
          <CardTitle className="text-lg">Payment Method Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(summary.paymentMethodBreakdown).map(([method, amount]) => {
              const percentage = getPercentage(amount, summary.totalIncome);
              return (
                <div key={method}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{method.replace("_", " ")}</span>
                    <span className="text-sm font-semibold">{formatCurrency(amount, "NPR")}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
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

      {/* Source Breakdown */}
      <Card className="border shadow-xs">
        <CardHeader>
          <CardTitle className="text-lg">Income Source Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(summary.sourceBreakdown).map(([source, amount]) => {
              const percentage = getPercentage(amount, summary.totalIncome);
              const sourceLabel = source.replace("_", " ");
              return (
                <div key={source}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{sourceLabel}</span>
                    <span className="text-sm font-semibold">{formatCurrency(amount, "NPR")}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
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

      {/* Category Breakdown */}
      <Card className="border shadow-xs lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">Category-wise Income</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(summary.categoryBreakdown)
              .sort(([, a], [, b]) => b - a)
              .map(([category, amount]) => {
                const percentage = getPercentage(amount, summary.totalIncome);
                return (
                  <div key={category}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">{category}</span>
                      <span className="text-sm font-semibold">{formatCurrency(amount, "NPR")}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full transition-all"
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
    </div>
  );
}
