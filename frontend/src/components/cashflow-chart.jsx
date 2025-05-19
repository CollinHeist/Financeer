"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { useEffect, useState } from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { getMonthlyCashFlow, getAccounts } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  return `$${value}`;
};

const chartConfig = {
  income: {
    label: "Income",
    color: "hsl(var(--chart-1))",
  },
  expenses: {
    label: "Expenses",
    color: "hsl(var(--chart-2))",
  },
};

const DATE_RANGES = {
  YTD: 'Year to Date',
  LAST_12_MONTHS: 'Last 12 Months',
  LAST_YEAR: 'Previous Year',
  ALL_TIME: 'All Time'
};

export function CashFlowChart() {
  const [dateRange, setDateRange] = useState(DATE_RANGES.YTD);
  const [selectedAccountId, setSelectedAccountId] = useState(null);

  // Get all accounts with caching
  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: getAccounts,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    cacheTime: 30 * 60 * 1000, // Keep data in cache for 30 minutes
  });

  // Set initial account when accounts are loaded
  useEffect(() => {
    if (accounts?.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts.find(account => account.type === 'checking')?.id || accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  // Calculate date range based on selection
  const getDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();

    switch (dateRange) {
      case DATE_RANGES.YTD:
        startDate.setMonth(0, 1); // January 1st of current year
        break;
      case DATE_RANGES.LAST_12_MONTHS:
        startDate.setMonth(startDate.getMonth() - 12); // 12 months ago from today
        break;
      case DATE_RANGES.LAST_YEAR:
        // Set to January 1st of previous year
        startDate.setFullYear(startDate.getFullYear() - 1);
        startDate.setMonth(0, 1);
        // Set end date to December 31st of previous year
        endDate.setFullYear(endDate.getFullYear() - 1);
        endDate.setMonth(11, 31);
        break;
      case DATE_RANGES.ALL_TIME:
        startDate.setFullYear(startDate.getFullYear() - 5); // Show last 5 years
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 6); // Default to last 6 months
    }

    return { startDate, endDate };
  };

  const { startDate, endDate } = getDateRange();

  // Format dates for API
  const formatDate = (date) => date.toISOString().split('T')[0];

  // Fetch cash flow data with improved caching
  const { data: cashFlowData, isLoading: dataLoading, error } = useQuery({
    queryKey: ['monthlyCashFlow', selectedAccountId, formatDate(startDate), formatDate(endDate)],
    queryFn: () => getMonthlyCashFlow(
      selectedAccountId,
      formatDate(startDate),
      formatDate(endDate)
    ),
    enabled: !!selectedAccountId,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    cacheTime: 30 * 60 * 1000, // Keep data in cache for 30 minutes
    keepPreviousData: true, // Keep showing previous data while loading new data
  });

  // Format data for the chart
  const formattedData = cashFlowData?.map((item) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    income: item.income,
    expenses: item.expenses,
  })) || [];

  const isLoading = accountsLoading || (dataLoading && !cashFlowData);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold">Monthly Cash Flow</h3>
            <Select
              value={selectedAccountId?.toString()}
              onValueChange={(value) => setSelectedAccountId(parseInt(value))}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
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
            onValueChange={setDateRange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
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
            <h3 className="text-lg font-semibold">Monthly Cash Flow</h3>
            <Select
              value={selectedAccountId?.toString()}
              onValueChange={(value) => setSelectedAccountId(parseInt(value))}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
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
            onValueChange={setDateRange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">Monthly Cash Flow</h3>
          <Select
            value={selectedAccountId?.toString()}
            onValueChange={(value) => setSelectedAccountId(parseInt(value))}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
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
          onValueChange={setDateRange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={DATE_RANGES.YTD}>Year to Date</SelectItem>
            <SelectItem value={DATE_RANGES.LAST_12_MONTHS}>Last 12 Months</SelectItem>
            <SelectItem value={DATE_RANGES.LAST_YEAR}>Previous Year</SelectItem>
            <SelectItem value={DATE_RANGES.ALL_TIME}>All Time</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardBody>
        {!formattedData.length ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No data available for the selected period
          </div>
        ) : (
          <ChartContainer config={chartConfig}>
            <BarChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={formatCurrency} />
              <ChartTooltip
                content={
                  <ChartTooltipContent 
                    formatter={(value, name) => {
                      if (typeof value === 'number') {
                        const formattedValue = value.toLocaleString('en-US', {
                          style: 'currency',
                          currency: 'USD',
                        });
                        return name === 'expenses' 
                          ? <span className="text-red-500">Expenses: -{formattedValue}</span>
                          : <span className="text-green-500">Income: +{formattedValue}</span>;
                      }
                      return value;
                    }}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="income" fill="hsl(var(--chart-1))" radius={4} name="income" />
              <Bar dataKey="expenses" fill="hsl(var(--chart-2))" radius={4} name="expenses" />
            </BarChart>
          </ChartContainer>
        )}
      </CardBody>
    </Card>
  );
} 