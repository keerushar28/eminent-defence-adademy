"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ChartTooltipContentProps {
  active?: boolean;
  payload?: Record<string, unknown>[];
  label?: string;
  hideLabel?: boolean;
  hideIndicator?: boolean;
  indicator?: "line" | "dot" | "dashed";
  nameKey?: string;
  labelKey?: string;
}

const ChartTooltip = ({ children }: { children?: React.ReactNode; [key: string]: unknown }) => {
  return <>{children}</>;
};

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  ChartTooltipContentProps
>(
  (
    {
      active,
      payload,
      label,
      hideLabel = false,
      hideIndicator = false,
      indicator = "dot",
    },
    ref
  ) => {
    if (!active || !payload || payload.length === 0) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-32 items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl"
        )}
      >
        {!hideLabel && label && (
          <div className="font-medium text-foreground">{label}</div>
        )}
        <div className="grid gap-1.5">
          {payload.map((item: Record<string, unknown>, index: number) => {
            const indicatorColor = item.color || item.fill || "hsl(var(--primary))";

            return (
              <div
                key={`item-${index}`}
                className="flex w-full items-center gap-2"
              >
                {!hideIndicator && (
                  <div
                    className={cn(
                      "shrink-0 rounded-[2px]",
                      indicator === "dot" && "h-2.5 w-2.5 rounded-full",
                      indicator === "line" && "h-2.5 w-0.5",
                      indicator === "dashed" && "h-2.5 w-0.5 border-l-2 border-dashed"
                    )}
                    style={{
                      backgroundColor: indicator !== "dashed" ? indicatorColor : undefined,
                      borderColor: indicator === "dashed" ? indicatorColor : undefined,
                    }}
                  />
                )}
                <div className="flex flex-1 justify-between gap-2 leading-none">
                  <span className="text-muted-foreground">
                    {item.name || item.dataKey}
                  </span>
                  <span className="font-mono font-medium tabular-nums text-foreground">
                    {item.value}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

ChartTooltipContent.displayName = "ChartTooltipContent";

export { ChartTooltip, ChartTooltipContent };
