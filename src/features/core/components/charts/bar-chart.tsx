"use client";

import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, Rectangle, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/features/core/components/card";
import { ChartContainer, ChartConfig } from "../chart";
import { ChartTooltipContent } from "../chart-tooltip";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useMemo } from "react";

interface BarChartProps<T extends Record<string, unknown>> {
  title: string;
  description?: string;
  data: T[];
  dataKey: keyof T;
  xAxisKey: keyof T;
  colors?: string[];
  formatValue?: (value: number) => string;
  height?: number;
  showYAxis?: boolean;
  footerTrend?: {
    value: number;
    label: string;
  };
  footerDescription?: string;
}

const DEFAULT_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function BarChart<T extends Record<string, unknown>>({
  title,
  description,
  data,
  dataKey,
  xAxisKey,
  colors = DEFAULT_COLORS,
  formatValue = (value) => value.toString(),
  showYAxis = true,
  footerTrend,
  footerDescription,
}: BarChartProps<T>) {
  const chartConfig = useMemo(() => {
    const config: ChartConfig = {
      [dataKey as string]: {
        label: (dataKey as string).charAt(0).toUpperCase() + (dataKey as string).slice(1),
      },
    };

    // Add config for each unique x-axis value
    data.forEach((item, index) => {
      const key = String(item[xAxisKey]).toLowerCase().replace(/\s+/g, "_");
      config[key] = {
        label: String(item[xAxisKey]),
        color: colors[index % colors.length],
      };
    });

    return config;
  }, [data, dataKey, xAxisKey, colors]);

  const chartData = useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      fill: colors[index % colors.length],
    }));
  }, [data, colors]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[370px] w-full">
          <RechartsBarChart data={chartData} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={xAxisKey as string}
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            {showYAxis && (
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                width={90}
                tickFormatter={formatValue}
                tick={{ fontSize: 12 }}
              />
            )}
            <Tooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar
              className="cursor-po"
              dataKey={dataKey as string}
              strokeWidth={2}
              radius={8}
              activeBar={({ ...props }) => {
                return (
                  <Rectangle
                    {...props}
                    fillOpacity={0.8}
                    stroke={props.payload.fill}
                    strokeDasharray={4}
                    strokeDashoffset={4}
                  />
                );
              }}
            />
          </RechartsBarChart>
        </ChartContainer>
      </CardContent>
      {(footerTrend || footerDescription) && (
        <CardFooter className="flex-col items-start gap-2 text-sm">
          {footerTrend && (
            <div className="flex gap-2 leading-none font-medium">
              {footerTrend.label}{" "}
              {footerTrend.value >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
            </div>
          )}
          {footerDescription && (
            <div className="text-muted-foreground leading-none">
              {footerDescription}
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  );
}