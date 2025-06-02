"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { useQuery } from "@tanstack/react-query";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

import { getDailyBalances } from "@/lib/api/balances";


const formatCurrency = (value) => {
  if (value >= 1000000000) {
    return `$${(value / 1000000000).toFixed(1)}B`;
  }
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(2)}`;
};

const chartConfig = {
  balance: {
    label: "Balance",
    color: "var(--chart-1)",
  },
  projected: {
    label: "Projected",
    color: "var(--chart-2)",
  },
};

export default function DailyBalance({ accountId, days = 21 }) {
  const [timeRange, setTimeRange] = useState("week");
  
  // Calculate date range based on selected time range
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 14); // Always start 14 days ago
  
  const endDate = new Date(today);
  switch (timeRange) {
    case "week":
      endDate.setDate(today.getDate() + 7);
      break;
    case "month":
      endDate.setDate(today.getDate() + 30);
      break;
    case "threeMonths":
      endDate.setDate(today.getDate() + 90);
      break;
  }

  // Format dates for API
  const formatDate = (date) => date.toISOString().split('T')[0];

  // Fetch daily balance data
  const { data: balanceData, isLoading } = useQuery({
    queryKey: ['dailyBalances', accountId, formatDate(startDate), formatDate(endDate)],
    queryFn: () => getDailyBalances(
      accountId,
      formatDate(startDate),
      formatDate(endDate)
    ),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    cacheTime: 30 * 60 * 1000, // Keep data in cache for 30 minutes
  });

  // Format data for the chart and split into past and future
  const formattedData = balanceData?.map((item) => {
    const itemDate = new Date(item.date);
    const isProjected = itemDate > today;
    const isYesterday = itemDate.getDate() === today.getDate() - 1;

    return {
      date: itemDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      actual_balance: isProjected ? null : item.balance,
      projected_balance: isProjected || isYesterday ? item.balance : null,
    };
  }) || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Daily Balance</h3>
        </CardHeader>
        <CardBody>Loading...</CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <h3 className="text-lg font-semibold">Daily Balance</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-[180px] justify-between">
              {timeRange === "week" && "Next Week"}
              {timeRange === "month" && "Next Month"}
              {timeRange === "threeMonths" && "Next 3 Months"}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTimeRange("week")}>
              Next Week
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTimeRange("month")}>
              Next Month
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTimeRange("threeMonths")}>
              Next 3 Months
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardBody>
        <div className="w-full">
          <ChartContainer config={chartConfig}>
            <AreaChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={formatCurrency}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                domain={[
                  (dataMin) => dataMin - (dataMin === 0 ? 25 : dataMin * 0.1),
                  (dataMax) => dataMax + (dataMax === 0 ? 25 : dataMax * 0.1),
                  // (dataMin) => Math.floor(dataMin / 1000 - 1) * 1000,
                  // (dataMax) => Math.ceil(dataMax / 1000 + 1) * 1000
                ]}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value, name, item, index) => (
                      <>
                        {index === 0 && 
                          <>
                            <div
                              className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-[--color-bg]"
                              style={{"--color-bg": `var(--chart-${item.payload?.projected_balance ? 2 : 1})`}}
                            />
                            {item.payload?.projected_balance ? "Projected" : "Balance"}
                            <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                              <span className="font-normal text-muted-foreground">$</span>
                              {value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          </>
                        }
                      </>
                    )}
                  />
                }
              />
              {/* Past Balance */}
              <Area
                type="step"
                dataKey="actual_balance"
                stroke="var(--chart-1)"
                strokeWidth={3}
                dot={false}
                fill="var(--chart-1)"
                fillOpacity={0.4}
                connectNulls={true}
              />
              {/* Future Balance */}
              <Area
                type="step"
                dataKey="projected_balance"
                stroke="var(--chart-2)"
                strokeWidth={3}
                strokeDasharray="5 5"
                dot={false}
                fill="var(--chart-2)"
                fillOpacity={0.3}
                connectNulls={true}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </CardBody>
    </Card>
  );
} 