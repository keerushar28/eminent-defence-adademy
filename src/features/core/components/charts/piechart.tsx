"use client";

import * as React from "react";
import { Label, Pie, PieChart as RechartsPieChart, Sector, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../card";
import { ChartContainer, ChartConfig } from "../chart";
import { ChartTooltipContent } from "../chart-tooltip";
import { ChartLegendContent } from "../chart-legend";

interface PieChartProps<T extends Record<string, unknown>> {
    title: string;
    description?: string;
    data: T[];
    dataKey: keyof T;
    nameKey: keyof T;
    colors?: string[];
    showLegend?: boolean;
    innerRadius?: number;
    centerLabel?: string;
    formatValue?: (value: number) => string;
}

const DEFAULT_COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
];

export function PieChart<T extends Record<string, unknown>>({
    title,
    description,
    data,
    dataKey,
    nameKey,
    colors = DEFAULT_COLORS,
    showLegend = true,
    innerRadius = 60,
    centerLabel = "Total",
    formatValue = (value) => value.toLocaleString(),
}: PieChartProps<T>) {
    const total = React.useMemo(() => {
        return data.reduce((acc, curr) => {
            const value = curr[dataKey];
            return acc + (typeof value === 'number' ? value : 0);
        }, 0);
    }, [data, dataKey]);

    const chartConfig = React.useMemo(() => {
        const config: ChartConfig = {};
        data.forEach((item, index) => {
            const name = item[nameKey];
            const key = String(name).toLowerCase().replace(/\s+/g, "_");
            config[key] = {
                label: String(name),
                color: colors[index % colors.length],
            };
        });
        return config;
    }, [data, nameKey, colors]);

    const chartData = React.useMemo(() => {
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
                <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[350px]">
                    <RechartsPieChart>
                        <Tooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <Pie
                            data={chartData}
                            dataKey={dataKey as string}
                            nameKey={nameKey as string}
                            innerRadius={innerRadius}
                            strokeWidth={5}
                            stroke="hsl(var(--background))"
                            activeShape={({ ...props }) => {
                                return (
                                    <Sector
                                        {...props}
                                        fillOpacity={0.8}
                                        stroke="hsl(var(--border))"
                                        strokeWidth={2}
                                        strokeDasharray={4}
                                        strokeDashoffset={4}
                                    />
                                );
                            }}
                        >
                            <Label
                                content={({ viewBox }) => {
                                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                        return (
                                            <text
                                                x={viewBox.cx}
                                                y={viewBox.cy}
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                            >
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={viewBox.cy - 20}
                                                    className="fill-foreground text-3xl font-bold"
                                                >
                                                    {formatValue(total)}
                                                </tspan>
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy || 0) }
                                                    className="fill-muted-foreground"
                                                >
                                                    {centerLabel}
                                                </tspan>
                                            </text>
                                        );
                                    }
                                }}
                            />
                        </Pie>
                        {showLegend && (
                            <Legend
                                content={<ChartLegendContent nameKey={nameKey as string} />}
                                wrapperStyle={{ paddingTop: "20px" }}
                            />
                        )}
                    </RechartsPieChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}