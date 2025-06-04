'use client';

import { Card, CardContent } from "@/components/ui/card";

import ExpenseTable from "@/components/expenses/table";

export default function ExpensePage() {
  return (
    <Card>
      <CardContent className="mt-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
            <p className="text-default-500 mt-2">
              Create and manage budgets to track your spending. Set budget limits, 
              monitor utilization, and stay on top of your financial goals.
            </p>
          </div>
        </div>
        <ExpenseTable />
      </CardContent>
    </Card>
  );
}
