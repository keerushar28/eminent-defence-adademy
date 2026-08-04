"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/features/core/components/card";
import { LedgerSummary } from "../types";
import { TrendingUp, Clock, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface SummaryCardsProps {
  summary: LedgerSummary;
}

export default function SummaryCards({ summary }: SummaryCardsProps) {
  const totalExpected = summary.totalIncome + summary.totalPending;
  const collectionRate = totalExpected > 0 ? ((summary.totalIncome / totalExpected) * 100).toFixed(1) : 0;

  const cards = [
    {
      title: "Total Income",
      value: summary.totalIncome,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Total Pending",
      value: summary.totalPending,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Collection Rate",
      value: collectionRate,
      icon: TrendingDown,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      suffix: "%",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="border shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <div className={`${card.bgColor} p-2 rounded-lg`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {card.suffix ? card.value : formatCurrency(Number(card.value), "NPR")}
                {card.suffix && card.suffix}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
