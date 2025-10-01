"use client"

import { Area, AreaChart, XAxis, YAxis, ReferenceLine, TooltipProps } from "recharts"
import { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent"

import {
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart"
import { formatMinutes } from "@/lib/utils";

interface ElegantChartProps {
  chartData: any[];
  yAxisDomain: any;
  targetLineValue?: any;
}



const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    const date = new Date(label);
    const formattedDate = date.toLocaleDateString("ar-EG", {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return (
      <div className="p-2.5 text-sm rounded-lg border bg-background/95 backdrop-blur-sm shadow-lg">
        <p className="font-medium text-foreground">{formattedDate}</p>
        <p className="text-muted-foreground">
          {`الإنجاز: ${formatMinutes(payload[0].value as number)}`}
        </p>
      </div>
    );
  }
  return null;
};

export function ElegantChart({ chartData, yAxisDomain, targetLineValue }: ElegantChartProps) {
  return (
    <ChartContainer config={{}} className="min-h-[300px] w-full">
      <AreaChart
        accessibilityLayer
        data={chartData}
        margin={{
          top: 5,
          right: 30,
          left: -10,
          bottom: 0,
        }}
      >
        <defs>
          <linearGradient id="fillAccent" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="hsl(var(--chart-accent))"
              stopOpacity={0.8}
            />
            <stop
              offset="95%"
              stopColor="hsl(var(--chart-accent))"
              stopOpacity={0.1}
            />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => {
            const date = new Date(value)
            return date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickCount={4}
          domain={yAxisDomain}
          tickFormatter={(value) => `${Math.floor(value / 60)}h`}
          dx={-10}
        />
        <ChartTooltip
          cursor={{ stroke: "hsl(var(--chart-accent))", strokeWidth: 1, strokeDasharray: "3 3" }}
          content={<CustomTooltip />}
        />
        <Area
          dataKey="totalMinutes"
          type="natural"
          fill="url(#fillAccent)"
          stroke="hsl(var(--chart-accent))"
          strokeWidth={2}
          dot={false}
          activeDot={{
            r: 6,
            className: "fill-[hsl(var(--chart-accent))] stroke-background"
          }}
        />
        {targetLineValue > 0 && (
          <ReferenceLine 
            y={targetLineValue} 
            stroke="hsl(var(--muted-foreground))" 
            strokeDasharray="3 3" 
            strokeWidth={1}
          />
        )}
      </AreaChart>
    </ChartContainer>
  )
}
