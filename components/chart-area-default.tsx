"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ReferenceLine } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface ChartAreaDefaultProps {
  chartData: any;
  yAxisDomain: any;
  targetLineValue?: any;
}

export function ChartAreaDefault({ chartData, yAxisDomain, targetLineValue }: ChartAreaDefaultProps) {
  return (
    <ChartContainer config={{}} className="min-h-[300px] w-full">
      <AreaChart
        accessibilityLayer
        data={chartData}
        margin={{
          top: 20,
          right: 30,
          left: -15,
          bottom: 10,
        }}
      >
        <defs>
          <linearGradient id="fillGreen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
          </linearGradient>
        </defs>

        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={20}
          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        />
        <YAxis 
          domain={yAxisDomain} 
          tickLine={false} 
          axisLine={false} 
          tickMargin={18} 
          tickFormatter={(value) => `${value}h`}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="line" labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} />}
        />
        <ReferenceLine y={targetLineValue} label={{ value: `Target: ${targetLineValue}h`, position: 'insideTopRight' }} stroke="hsl(var(--primary))" strokeDasharray="3 3" />
        <Area
          dataKey="hours"
          type="natural"
          fill="url(#fillGreen)"
          stroke="#10B981"
          stackId="a"
        />
      </AreaChart>
    </ChartContainer>
  )
}
