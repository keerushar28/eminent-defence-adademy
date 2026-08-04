"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ChartLegendContentProps {
  payload?: Record<string, unknown>[];
  nameKey?: string;
  className?: string;
}

const ChartLegend = ({ children }: { children: React.ReactNode; className?: string }) => {
  return <>{children}</>;
};

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  ChartLegendContentProps
>(({ payload, nameKey = "name", className }, ref) => {
  if (!payload || payload.length === 0) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-center gap-4 flex-wrap",
        className
      )}
    >
      {payload.map((item: Record<string, unknown>, index: number) => {
        const indicatorColor = item.color || item.fill || "hsl(var(--primary))";
        
        return (
          <div
            key={`legend-${index}`}
            className="flex items-center gap-1.5"
          >
            <div
              className="h-2 w-2 shrink-0 rounded-[2px]"
              style={{
                backgroundColor: indicatorColor,
              }}
            />
            <span className="text-xs text-muted-foreground">
              {item[nameKey] || item.value}
            </span>
          </div>
        );
      })}
    </div>
  );
});

ChartLegendContent.displayName = "ChartLegendContent";

export { ChartLegend, ChartLegendContent };
