'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Label,
  PolarGrid,
  RadialBarChart,
  PolarRadiusAxis,
  RadialBar,
} from 'recharts';
import { getMonthlyAccountSnapshot } from '@/lib/api/cashflow';
import { formatCurrency } from '@/lib/utils';
import { format, addMonths, subMonths, isSameMonth } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

const chartConfig = {
  spent: {
    label: 'Spent',
    color: 'hsl(var(--chart-1))',
  },
};

export default function MonthlySnapshot({ accountId }) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Calculate date range for selected month
  const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

  const { data: snapshotData, isLoading, error } = useQuery({
    queryKey: ['monthlySnapshot', accountId, startDate.toISOString(), endDate.toISOString()],
    queryFn: () => getMonthlyAccountSnapshot(
      accountId,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    ),
    enabled: !!accountId,
  });

  // Generate last 6 months
  const months = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      date,
      label: format(date, 'MMM yyyy'),
      isSelected: isSameMonth(date, selectedDate)
    };
  }).reverse();

  const handleMonthSelect = (date) => {
    setSelectedDate(date);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Monthly Snapshot</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-[140px] justify-between">
                {format(selectedDate, 'MMM yyyy')}
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {months.map((month) => (
                <DropdownMenuItem
                  key={month.label}
                  onClick={() => handleMonthSelect(month.date)}
                  className={month.isSelected ? 'bg-accent' : ''}
                >
                  {month.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Loading snapshot data...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Monthly Snapshot</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-[140px] justify-between">
                {format(selectedDate, 'MMM yyyy')}
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {months.map((month) => (
                <DropdownMenuItem
                  key={month.label}
                  onClick={() => handleMonthSelect(month.date)}
                  className={month.isSelected ? 'bg-accent' : ''}
                >
                  {month.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-destructive">
            Error loading snapshot data
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!snapshotData?.length) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Monthly Snapshot</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-[140px] justify-between">
                {format(selectedDate, 'MMM yyyy')}
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {months.map((month) => (
                <DropdownMenuItem
                  key={month.label}
                  onClick={() => handleMonthSelect(month.date)}
                  className={month.isSelected ? 'bg-accent' : ''}
                >
                  {month.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No snapshot data available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort items by name
  const sortedData = [...snapshotData].sort((a, b) => {
    const nameA = a.bill_name || a.expense_name || '';
    const nameB = b.bill_name || b.expense_name || '';
    return nameA.localeCompare(nameB);
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Monthly Snapshot</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-[140px] justify-between">
              {format(selectedDate, 'MMM yyyy')}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {months.map((month) => (
              <DropdownMenuItem
                key={month.label}
                onClick={() => handleMonthSelect(month.date)}
                className={month.isSelected ? 'bg-accent' : ''}
              >
                {month.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
          {sortedData.map((item) => {
            const name = item.bill_name || item.expense_name;
            const spent = Math.abs(item.spent);
            const budget = Math.abs(item.budget);
            const percentage = budget > 0 ? (spent / budget) * 100 : 0;
            const angle = Math.min(percentage, 100) / 100 * 360;
            const fill = percentage > 100
              ? 'hsl(var(--destructive))'
              : percentage < 99 ? 'hsl(var(--chart-1))' : 'rgb(235, 200, 26)'
            ;

            const chartData = [ { value: angle, name, fill } ];

            return (
              <div key={name} className="flex flex-col items-center p-2 border rounded-lg">
                <div className="w-full">
                  <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square max-h-[250px]"
                  >
                    <RadialBarChart
                      innerRadius={80}
                      outerRadius={110}
                      data={chartData}
                      startAngle={0}
                      endAngle={chartData[0].value}
                      barSize={20}
                    >
                      <PolarGrid
                        gridType="circle"
                        radialLines={false}
                        stroke="none"
                        className="first:fill-muted last:fill-background"
                        polarRadius={[86, 74]}
                      />
                      <RadialBar
                        minAngle={15}
                        background
                        cornerRadius={10}
                        clockWise={true}
                        dataKey="value"
                        label={({ value }) => `${value.toFixed(1)}%`}
                      />
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
                                    className="fill-foreground text-3xl font-bold"
                                  >
                                    ${spent.toFixed(0)}
                                  </tspan>
                                  <tspan
                                    x={viewBox.cx}
                                    y={(viewBox.cy || 0) + 24}
                                    className="fill-muted-foreground"
                                  >
                                    {name}
                                  </tspan>
                                  <tspan
                                    x={viewBox.cx}
                                    y={(viewBox.cy || 0) + 42}
                                    className="fill-muted-foreground"
                                  >
                                    {percentage.toFixed(0)}%
                                  </tspan>
                                </text>
                              )
                            }
                          }}
                        />
                      </PolarRadiusAxis>
                    </RadialBarChart>
                  </ChartContainer>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
