"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/features/core/components/card";
import { Badge } from "@/features/core/components/badge";
import {  CheckCircle, Clock, TrendingUp, Wallet } from "lucide-react";
import type { SettlementStats } from "../types";

interface SettlementStatsCardsProps {
  stats: SettlementStats;
}

export function SettlementStatsCards({ stats }: SettlementStatsCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NP", {
      style: "currency",
      currency: "NPR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const settlementPercentage = stats.totalCollected > 0 
    ? (stats.totalSettled / stats.totalCollected) * 100 
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalCollected)}</div>
          <p className="text-xs text-muted-foreground">
            From {stats.totalPayments} payments
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Settled</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(stats.totalSettled)}
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs">
              {settlementPercentage.toFixed(1)}%
            </Badge>
            <p className="text-xs text-muted-foreground">of total</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Remaining Settlement</CardTitle>
          <Clock className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {formatCurrency(stats.remainingSettlement)}
          </div>
          <p className="text-xs text-muted-foreground">
            Pending settlement
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Settlement Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {settlementPercentage.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            {settlementPercentage >= 80 ? "Excellent" : settlementPercentage >= 60 ? "Good" : "Needs attention"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}