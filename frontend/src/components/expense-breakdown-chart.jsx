'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from "@heroui/card";
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import { getAllAccounts } from "@/lib/api/accounts";
import { getAccountBillBreakdown } from "@/lib/api/transactions";

const DATE_RANGES = {
  CURRENT_MONTH: 'Current Month',
  LAST_MONTH: 'Last Month',
  LAST_3_MONTHS: 'Last 3 Months',
  YTD: 'Year to Date',
  LAST_12_MONTHS: 'Last 12 Months',
  LAST_YEAR: 'Previous Year',
  ALL_TIME: 'All Time'
};

const chartConfig = {
  colors: [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)',
  ],
  stroke: 'hsl(var(--background))',
  tooltip: {
    formatter: (value, name) => {
      const total = billData?.total_amount || 0;
      const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
      const formattedValue = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
      return [formattedValue, `${name} (${percentage}%)`];
    }
  }
};

const getColorVariation = (baseColor, index) => {
  if (index < chartConfig.colors.length) {
    return baseColor;
  }
  // Extract the HSL values from the base color
  const baseHsl = baseColor.match(/hsl\(var\(--chart-(\d+)\)\)/);
  if (!baseHsl) return baseColor;
  
  const baseIndex = parseInt(baseHsl[1]);
  const repeatCount = Math.floor(index / chartConfig.colors.length);
  const lightnessAdjustment = repeatCount * 10; // Increase lightness by 10% each repeat
  
  return `var(--chart-${baseIndex} / ${1 - (lightnessAdjustment / 100)}`;
};

export function ExpenseBreakdownChart() {
  const [dateRange, setDateRange] = useState(DATE_RANGES.CURRENT_MONTH);
  const [selectedAccountId, setSelectedAccountId] = useState('all');

  // Get all accounts with caching
  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: getAllAccounts,
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
  });

  // Set initial account when accounts are loaded
  useEffect(() => {
    if (accounts?.length > 0 && selectedAccountId === 'all') {
      // No need to set a default account since we're using 'all'
      return;
    }
  }, [accounts, selectedAccountId]);

  // Calculate date range based on selection
  const getDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();

    switch (dateRange) {
      case DATE_RANGES.CURRENT_MONTH:
        startDate.setDate(1); // First day of current month
        break;
      case DATE_RANGES.LAST_MONTH:
        startDate.setMonth(startDate.getMonth() - 1);
        startDate.setDate(1); // First day of last month
        endDate.setDate(0); // Last day of last month
        break;
      case DATE_RANGES.LAST_3_MONTHS:
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case DATE_RANGES.YTD:
        startDate.setMonth(0, 1);
        break;
      case DATE_RANGES.LAST_12_MONTHS:
        startDate.setMonth(startDate.getMonth() - 12);
        break;
      case DATE_RANGES.LAST_YEAR:
        startDate.setFullYear(startDate.getFullYear() - 1);
        startDate.setMonth(0, 1);
        endDate.setFullYear(endDate.getFullYear() - 1);
        endDate.setMonth(11, 31);
        break;
      case DATE_RANGES.ALL_TIME:
        startDate.setFullYear(startDate.getFullYear() - 5);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 6);
    }

    return { startDate, endDate };
  };

  const { startDate, endDate } = getDateRange();

  // Format dates for API
  const formatDate = (date) => date.toISOString().split('T')[0];

  // Fetch expense breakdown data
  const { data: billData, isLoading: dataLoading, error } = useQuery({
    queryKey: ['billBreakdown', selectedAccountId, formatDate(startDate), formatDate(endDate)],
    queryFn: () => getAccountBillBreakdown(
      selectedAccountId,
      formatDate(startDate),
      formatDate(endDate)
    ),
    enabled: true,
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    keepPreviousData: true,
  });

  const isLoading = accountsLoading || (dataLoading && !billData);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold">Expense Breakdown</h3>
            <Select
              value={selectedAccountId}
              onValueChange={(value) => setSelectedAccountId(value)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                {accounts?.map((account) => (
                  <SelectItem key={account.id} value={account.id.toString()}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select
            value={dateRange}
            onValueChange={(value) => setDateRange(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={DATE_RANGES.CURRENT_MONTH}>Current Month</SelectItem>
              <SelectItem value={DATE_RANGES.LAST_MONTH}>Last Month</SelectItem>
              <SelectItem value={DATE_RANGES.LAST_3_MONTHS}>Last 3 Months</SelectItem>
              <SelectItem value={DATE_RANGES.YTD}>Year to Date</SelectItem>
              <SelectItem value={DATE_RANGES.LAST_12_MONTHS}>Last 12 Months</SelectItem>
              <SelectItem value={DATE_RANGES.LAST_YEAR}>Previous Year</SelectItem>
              <SelectItem value={DATE_RANGES.ALL_TIME}>All Time</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardBody>Loading...</CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold">Expense Breakdown</h3>
            <Select
              value={selectedAccountId}
              onValueChange={(value) => setSelectedAccountId(value)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                {accounts?.map((account) => (
                  <SelectItem key={account.id} value={account.id.toString()}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select
            value={dateRange}
            onValueChange={(value) => setDateRange(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={DATE_RANGES.CURRENT_MONTH}>Current Month</SelectItem>
              <SelectItem value={DATE_RANGES.LAST_MONTH}>Last Month</SelectItem>
              <SelectItem value={DATE_RANGES.LAST_3_MONTHS}>Last 3 Months</SelectItem>
              <SelectItem value={DATE_RANGES.YTD}>Year to Date</SelectItem>
              <SelectItem value={DATE_RANGES.LAST_12_MONTHS}>Last 12 Months</SelectItem>
              <SelectItem value={DATE_RANGES.LAST_YEAR}>Previous Year</SelectItem>
              <SelectItem value={DATE_RANGES.ALL_TIME}>All Time</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardBody className="text-red-500">Error: {error.message}</CardBody>
      </Card>
    );
  }

  const chartData = billData?.breakdown.map(item => ({
    name: item.bill_name,
    value: item.total_amount,
  })) || [];

  // Combine small categories into "Other"
  const processChartData = (data) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const threshold = total * 0.015; // 1.5% threshold

    const mainCategories = data.filter(item => item.value >= threshold);
    const otherCategories = data.filter(item => item.value < threshold);
    
    const otherTotal = otherCategories.reduce((sum, item) => sum + item.value, 0);
    
    if (otherTotal > 0) {
      return [...mainCategories, { name: 'Other', value: otherTotal }];
    }
    
    return mainCategories;
  };

  const processedChartData = processChartData(chartData);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">Expense Breakdown</h3>
          <Select
            value={selectedAccountId}
            onValueChange={(value) => setSelectedAccountId(value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Accounts</SelectItem>
              {accounts?.map((account) => (
                <SelectItem key={account.id} value={account.id.toString()}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Select
          value={dateRange}
          onValueChange={(value) => setDateRange(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={DATE_RANGES.CURRENT_MONTH}>Current Month</SelectItem>
            <SelectItem value={DATE_RANGES.LAST_MONTH}>Last Month</SelectItem>
            <SelectItem value={DATE_RANGES.LAST_3_MONTHS}>Last 3 Months</SelectItem>
            <SelectItem value={DATE_RANGES.YTD}>Year to Date</SelectItem>
            <SelectItem value={DATE_RANGES.LAST_12_MONTHS}>Last 12 Months</SelectItem>
            <SelectItem value={DATE_RANGES.LAST_YEAR}>Previous Year</SelectItem>
            <SelectItem value={DATE_RANGES.ALL_TIME}>All Time</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardBody className="flex flex-col flex-1">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-sm text-gray-600">Total Expenses</p>
            <p className="text-2xl font-bold">${billData?.total_bill.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={processedChartData}
                  // cx="40%"
                  // cy="50%"
                  labelLine={true}
                  label={({ name }) => name}
                  innerRadius={125}
                  outerRadius={175}
                  dataKey="value"
                  strokeWidth={2}
                >
                  {processedChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.name === 'Uncategorized' 
                        ? 'url(#uncategorized-pattern)' 
                        : entry.name === 'Other'
                        ? 'url(#other-pattern)'
                        : getColorVariation(chartConfig.colors[index % chartConfig.colors.length], index)}
                      stroke={chartConfig.stroke}
                    />
                  ))}
                </Pie>
                <defs>
                  <pattern id="uncategorized-pattern" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 10" stroke="hsl(var(--foreground))" strokeWidth="1" />
                  </pattern>
                  <pattern id="other-pattern" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 0 0 L 10 10" stroke="hsl(var(--muted-foreground))" strokeWidth="1" />
                  </pattern>
                </defs>
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent 
                      formatter={(value, name, item) => {
                        const total = billData?.total_bill || 0;
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                        return (
                          <>
                            <div
                              className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-[--color-bg]"
                              style={{"--color-bg": item.payload.fill}}
                            />
                            <div className="flex flex-1 justify-between items-center gap-2">
                              <span className="text-muted-foreground">{name}</span>
                              <div className="flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                                <span className="font-normal text-muted-foreground">$</span>
                                {value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                <span className="text-muted-foreground ml-1">({percentage}%)</span>
                              </div>
                            </div>
                          </>
                        );
                      }}
                    />
                  }
                />
                {/* <ChartLegend
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  content={<ChartLegendContent />}
                /> */}
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardBody>
    </Card>
  );
} 