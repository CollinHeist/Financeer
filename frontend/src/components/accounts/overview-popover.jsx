'use client';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatAmount, formatCurrency, formatDate } from '@/lib/utils';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { getDailyBalances } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';

const chartConfig = {
  balance: {
    label: "Balance",
    color: "hsl(var(--chart-1))",
  },
  projected: {
    label: "Projected",
    color: "hsl(var(--chart-2))",
  },
};

export default function AccountOverviewPopover({ account, children }) {
  const [isOpen, setIsOpen] = useState(false);

  // Calculate date range: one week before and after today
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 7);
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 7);

  const { data: balanceData, isLoading, error } = useQuery({
    queryKey: ['dailyBalances', account?.id, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]],
    queryFn: async () => {
      return await getDailyBalances(
        account.id,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
    },
    enabled: !!account?.id && isOpen,
    select: (data) => {
      return data
        .map(item => {
          const itemDate = new Date(item.date);
          const isProjected = itemDate > today;
          const isToday = itemDate.getDate() === today.getDate();

          return {
            date: itemDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            actual_balance: isProjected && !isToday ? null : item.balance,
            projected_balance: isProjected || isToday ? item.balance : null,
            rawDate: itemDate,
          };
        })
        .sort((a, b) => a.rawDate - b.rawDate);
    }
  });

  if (!account) return null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-96">
        <div className="space-y-4">
          <div>
            <Link href={`/accounts/${account.id}`} className="font-medium hover:underline">
              {account.name}
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Account Type</h4>
              <p className="mt-1 capitalize">{account.type.replace('_', ' ')}</p>
            </div>
            {account.last_balance && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Balance
                </h4>
                <p className="mt-1">{formatAmount(account.last_balance.balance)}</p>
                <p className="text-sm text-muted-foreground">
                  as of {formatDate(account.last_balance.date)}
                </p>
              </div>
            )}
          </div>

          <div className={isLoading || error || !balanceData?.length ? "h-32" : ""}>
            {isLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Loading balance data...
              </div>
            ) : error ? (
              <div className="flex h-full items-center justify-center text-sm text-destructive">
                Error loading balance data
              </div>
            ) : !balanceData?.length ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No balance data available
              </div>
            ) : (
              <ChartContainer config={chartConfig}>
                <LineChart data={balanceData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    tick={false}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    tickFormatter={formatCurrency}
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={60}
                  />
                  <ReferenceLine
                    x={today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name, item, index) => (
                          <>
                            {index === 0 && 
                              <>
                                <div
                                  className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-[--color-bg]"
                                  style={{"--color-bg": `hsl(var(--chart-${item.payload?.projected_balance ? 2 : 1}))`}}
                                />
                                {item.payload?.projected_balance ? "Projected" : "Balance"}
                                <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                                  {formatAmount(value)}
                                </div>
                              </>
                            }
                          </>
                        )}
                      />
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="actual_balance"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    dot={false}
                    connectNulls={true}
                  />
                  <Line
                    type="monotone"
                    dataKey="projected_balance"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    connectNulls={true}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
} 