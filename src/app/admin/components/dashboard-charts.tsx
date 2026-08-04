"use client";

import { BarChart } from "@/features/core/components/charts/bar-chart";
import { PieChart } from "@/features/core/components/charts/piechart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/features/core/components/card";
import { ChartContainer, ChartConfig } from "@/features/core/components/chart";
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { ChartTooltipContent } from "@/features/core/components/chart-tooltip";

interface DashboardChartsProps {
  categoryData: { name: string; students: number }[];
  inventoryData: { name: string; itemCount: number; totalStock: number }[];
  hostelData: { room: string; total: number; occupied: number; available: number }[];
  revenueData: { month: string; category: number; hostel: number; total: number }[];
}

// Vibrant color palette
const COLORS = {
  primary: "#3b82f6",      // Blue
  secondary: "#8b5cf6",    // Purple
  success: "#10b981",      // Green
  warning: "#f59e0b",      // Amber
  danger: "#ef4444",       // Red
  info: "#06b6d4",         // Cyan
  pink: "#ec4899",         // Pink
  indigo: "#6366f1",       // Indigo
};

const CHART_COLORS = [
  "#3b82f6", // Blue
  "#8b5cf6", // Purple
  "#10b981", // Green
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#06b6d4", // Cyan
  "#ec4899", // Pink
  "#6366f1", // Indigo
];

export function DashboardCharts({
  categoryData,
  inventoryData,
  hostelData,
  revenueData,
}: DashboardChartsProps) {
  const chartConfig: ChartConfig = {
    category: { label: "Category", color: COLORS.primary },
    hostel: { label: "Hostel", color: COLORS.secondary },
    occupied: { label: "Occupied", color: COLORS.success },
    available: { label: "Available", color: COLORS.info },
  };

  return (

    <>
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Monthly Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
            <CardDescription>Category and hostel payments over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <RechartsBarChart data={revenueData} accessibilityLayer>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  tickFormatter={(v) => `Rs.${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="category" fill={COLORS.primary} radius={[4, 4, 0, 0]} name="Category" />
                <Bar dataKey="hostel" fill={COLORS.secondary} radius={[4, 4, 0, 0]} name="Hostel" />
              </RechartsBarChart>
            </ChartContainer>
          </CardContent>
        </Card>


        {/* Category Distribution */}
        {categoryData.length > 0 ? (
          <PieChart
            title="Students by Category"
            description="Distribution of students across categories"
            data={categoryData}
            dataKey="students"
            nameKey="name"
            centerLabel="Students"
            colors={CHART_COLORS}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Students by Category</CardTitle>
              <CardDescription>Distribution of students across categories</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-[300px] text-muted-foreground">
              No category data available
            </CardContent>
          </Card>
        )}

        {/* Hostel Occupancy */}
        <Card>
          <CardHeader>
            <CardTitle>Hostel Room Occupancy</CardTitle>
            <CardDescription>Bed allocation status per room</CardDescription>
          </CardHeader>
          <CardContent>
            {hostelData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <RechartsBarChart data={hostelData} accessibilityLayer>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="room" tickLine={false} axisLine={false} tickMargin={10} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={10} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="occupied" stackId="a" fill={COLORS.success} name="Occupied" />
                  <Bar dataKey="available" stackId="a" fill={COLORS.info} radius={[4, 4, 0, 0]} name="Available" />
                </RechartsBarChart>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No hostel data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inventory by Category */}
        {inventoryData.length > 0 ? (
          <BarChart
            title="Inventory Stock by Category"
            description="Total stock levels per inventory category"
            data={inventoryData}
            dataKey="totalStock"
            xAxisKey="name"
            colors={CHART_COLORS}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Inventory Stock by Category</CardTitle>
              <CardDescription>Total stock levels per inventory category</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-[300px] text-muted-foreground">
              No inventory data available
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
