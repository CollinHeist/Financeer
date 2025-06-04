'use client';

import { CashFlowChart } from "@/components/cashflow-chart";
import { ExpenseBreakdownChart } from "@/components/expense-breakdown-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DailyBalance from "@/components/DailyBalance";
import MonthlySnapshot from "@/components/accounts/monthly-snapshot";
import { getMonthlyOverview } from "@/lib/api/cashflow";
import { useState } from "react";
import { formatAmount } from "@/lib/utils";
import { format, subMonths, isSameMonth } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Calculate date range for selected month
  const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

  // Generate last 6 months
  const months = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      date,
      label: format(date, 'MMM yyyy'),
      isSelected: isSameMonth(date, selectedDate)
    };
  }).reverse();

  const { data: overview = {
    income: 0,
    expenses: 0,
    balance: 0,
    savings_rate: 0,
  } } = useQuery({
    queryKey: ['monthlyOverview', startDate.toISOString(), endDate.toISOString()],
    queryFn: () => getMonthlyOverview(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    ),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    cacheTime: 30 * 60 * 1000, // Keep data in cache for 30 minutes
  });

  return (
    <section className="container mx-auto px-4 py-8 space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Financial Dashboard</h1>
      </div>

      {/* Quick Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(overview.income)}</div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground">
                  {format(selectedDate, 'MMMM yyyy')}
                  <ChevronDown className="ml-1 h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {months.map((month) => (
                  <DropdownMenuItem
                    key={month.label}
                    onClick={() => setSelectedDate(month.date)}
                    className={month.isSelected ? 'bg-accent' : ''}
                  >
                    {month.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(overview.expenses)}</div>
            <p className="text-xs text-muted-foreground">{format(selectedDate, 'MMMM yyyy')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{(overview.savings_rate * 100).toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">{format(selectedDate, 'MMMM yyyy')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(overview.balance)}</div>
            <p className="text-xs text-muted-foreground">Across all accounts</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts Section */}
      <ExpenseBreakdownChart />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <CashFlowChart />
          <DailyBalance accountId={1} />
        </div>
        <div className="space-y-8">
          <MonthlySnapshot />
        </div>
      </div>
    </section>
  );
} 