"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/features/core/components/card";
import { Skeleton } from "@/features/core/components/skeleton";
import { Bed, Users, AlertCircle, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { BarChart } from "@/features/core/components/charts/bar-chart";
import { PieChart } from "@/features/core/components/charts/piechart";
import { cn } from "@/lib/utils";

interface OverviewData {
  metrics: {
    totalBeds: number;
    occupiedBeds: number;
    availableBeds: number;
    occupancyRate: number;
    activeStudents: number;
    currentMonthRevenue: number;
    revenueTrend: number;
    expiringCount: number;
    pendingAmount: number;
  };
  charts: {
    revenueTrend: { month: string; revenue: number }[];
    bedStatusDistribution: { name: string; value: number; status: string }[];
  };
}

export default function Hostel() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/hostel/overview");
        if (!response.ok) {
          throw new Error("Failed to fetch overview data");
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    return `NPR ${amount.toLocaleString("en-NP", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getOccupancyColor = (rate: number) => {
    if (rate >= 70) return "text-emerald-600";
    if (rate >= 50) return "text-amber-600";
    return "text-rose-600";
  };


  if (error) {
    return (
      <div className="p-6">
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="pt-6">
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Occupancy Card */}
        {loading ? (
          <Card className="border">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-28" />
            </CardContent>
          </Card>
        ) : (
          <Card className="border hover:shadow-sm transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold ">Occupancy</CardTitle>
                <Bed className="h-4 w-4 " />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className={cn("text-2xl font-bold", getOccupancyColor(data?.metrics.occupancyRate || 0))}>
                  {data?.metrics.occupancyRate}%
                </div>
                <p className="text-xs ">
                  {data?.metrics.occupiedBeds}/{data?.metrics.totalBeds} beds • {data?.metrics.availableBeds} free
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Students Card */}
        {loading ? (
          <Card className="border">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-28" />
            </CardContent>
          </Card>
        ) : (
          <Card className="border hover:shadow-sm transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold">Students</CardTitle>
                <Users className="h-4 w-4 " />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-blue-600">
                  {data?.metrics.activeStudents}
                </div>
                <p className="text-xs">Currently residing</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Monthly Revenue Card */}
        {loading ? (
          <Card className="border">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-3 w-28" />
            </CardContent>
          </Card>
        ) : (
          <Card className="border hover:shadow-sm transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold ">Revenue</CardTitle>
                <Wallet className="h-4 w-4 " />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-2xl font-bold ">
                  {formatCurrency(data?.metrics.currentMonthRevenue || 0).split(" ")[1]}
                </div>
                <div className="flex items-center gap-1">
                  {data && data.metrics.revenueTrend >= 0 ? (
                    <>
                      <TrendingUp className="h-3 w-3 " />
                      <span className="text-xs  font-medium">+{data.metrics.revenueTrend}%</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-3 w-3 text-rose-600" />
                      <span className="text-xs text-rose-600 font-medium">{data?.metrics.revenueTrend}%</span>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Alerts Card */}
        {loading ? (
          <Card className="border">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-28" />
            </CardContent>
          </Card>
        ) : (
          <Card className="border hover:shadow-sm transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold text-orange-700">Alerts</CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-orange-600">
                  {data?.metrics.expiringCount}
                </div>
                <p className="text-xs text-orange-700">
                  Expiring in 7 days
                  {data && data.metrics.pendingAmount > 0 && (
                    <span className="block font-medium">NPR {(data.metrics.pendingAmount / 100000).toFixed(1)}L pending</span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Revenue Trend Chart */}
        {loading ? (
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-3 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ) : (
          <BarChart
            title="Revenue Trend"
            description="Last 6 months"
            data={data?.charts.revenueTrend || []}
            dataKey="revenue"
            xAxisKey="month"
            colors={["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"]}
            formatValue={formatCurrency}
            footerDescription=""
          />
        )}

        {/* Bed Status Distribution */}
        {loading ? (
          <Card className="border-slate-200">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-3 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ) : (
          <PieChart
            title="Bed Status"
            description="Current distribution"
            data={data?.charts.bedStatusDistribution || []}
            dataKey="value"
            nameKey="name"
            colors={["#3b82f6", "#10b981", "#f59e0b"]}
          />
        )}
      </div>
    </div>
  );
}