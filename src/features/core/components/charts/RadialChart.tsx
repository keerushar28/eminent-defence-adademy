"use client"

import { TrendingUp } from "lucide-react"
import {
    Label,
    PolarGrid,
    PolarRadiusAxis,
    RadialBar,
    RadialBarChart,
} from "recharts"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/features/core/components/card"
import { ChartConfig, ChartContainer } from "@/features/core/components/chart"

interface RadialChartProps {
    title: string
    description?: string
    data: Array<{
        name: string
        value: number
        fill: string
    }>
    centerValue: number
    centerLabel: string
    footerText?: string
    trendText?: string
    className?: string
    chartConfig: ChartConfig
}

export function RadialChart({
    title,
    description,
    data,
    centerValue,
    centerLabel,
    footerText,
    trendText,
    className = "",
    chartConfig
}: RadialChartProps) {
    return (
        <Card className={`flex flex-col ${className}`}>
            <CardHeader className="items-center pb-0">
                <CardTitle>{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent className="flex-1 pb-0">
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square max-h-[250px]"
                >
                    <RadialBarChart
                        data={data}
                        startAngle={0}
                        endAngle={250}
                        innerRadius={80}
                        outerRadius={110}
                    >
                        <PolarGrid
                            gridType="circle"
                            radialLines={false}
                            stroke="none"
                            className="first:fill-muted last:fill-background"
                            polarRadius={[86, 74]}
                        />
                        <RadialBar dataKey="value" background cornerRadius={10} />
                        <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
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
                                                    y={viewBox.cy}
                                                    className="fill-foreground text-4xl font-bold"
                                                >
                                                    {centerValue.toLocaleString()}
                                                </tspan>
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={(viewBox.cy || 0) + 24}
                                                    className="fill-muted-foreground"
                                                >
                                                    {centerLabel}
                                                </tspan>
                                            </text>
                                        )
                                    }
                                }}
                            />
                        </PolarRadiusAxis>
                    </RadialBarChart>
                </ChartContainer>
            </CardContent>
            {(footerText || trendText) && (
                <CardFooter className="flex-col gap-2 text-sm">
                    {trendText && (
                        <div className="flex items-center gap-2 leading-none font-medium">
                            {trendText} <TrendingUp className="h-4 w-4" />
                        </div>
                    )}
                    {footerText && (
                        <div className="text-muted-foreground leading-none">
                            {footerText}
                        </div>
                    )}
                </CardFooter>
            )}
        </Card>
    )
}