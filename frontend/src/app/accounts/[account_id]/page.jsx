'use client';

import { Suspense } from 'react';
import { Skeleton } from "@/components/ui/skeleton"
import { IconConfetti } from "@tabler/icons-react";
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAccount, getUpcomingAccountExpenses } from '@/lib/api';
import AccountSummary from "@/components/AccountSummary";
import ExpenseTable from '@/components/ExpenseTable';


export default function AccountPage() {
  const { account_id } = useParams();
  const [timeFilter, setTimeFilter] = useState('month'); // Default to 'month'

  // Calculate days based on selected time filter
  const getDays = () => {
    switch (timeFilter) {
      case 'week': return 7;
      case 'month': return 30;
      case 'threeMonths': return 90;
      default: return 30;
    }
  };

  // Fetch account data
  const { data: accountData, isLoading: accountLoading } = useQuery({
    queryKey: ['account', account_id],
    queryFn: () => getAccount(account_id),
    enabled: !!account_id,
  });

  // Fetch upcoming expense data
  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses', account_id, timeFilter],
    queryFn: () => getUpcomingAccountExpenses(account_id, getDays()),
    enabled: !!account_id,
  });

  const loading = accountLoading || expensesLoading;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Account Details</h1>
      <Suspense fallback={<div>Loading...</div>}>
        {accountLoading ? (
          <div className="flex flex-col space-y-3">
            <Skeleton className="h-[125px] w-[250px] rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ) : accountData ? (
          <AccountSummary data={accountData} />
        ) : (
          <div>No account data available</div>
        )}
      </Suspense>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Upcoming Expenses</h2>
        <div className="flex space-x-2">
          <button 
            variant="outline"
            onClick={() => setTimeFilter('week')}
            className={`px-3 py-1.5 text-sm rounded-md ${timeFilter === 'week' 
              ? 'bg-blue-500 text-white' 
              : 'bg-default-100 text-foreground/60'}`}
          >
            Next Week
          </button>
          <button 
            variant="outline"
            onClick={() => setTimeFilter('month')}
            className={`px-3 py-1.5 text-sm rounded-md ${timeFilter === 'month' 
              ? 'bg-blue-500 text-white' 
              : 'bg-default-100 text-foreground/60'}`}
          >
            Next Month
          </button>
          <button 
            variant="outline"
            onClick={() => setTimeFilter('threeMonths')}
            className={`px-3 py-1.5 text-sm rounded-md ${timeFilter === 'threeMonths' 
              ? 'bg-blue-500 text-white' 
              : 'bg-default-100 text-foreground/60'}`}
          >
            Next 3 Months
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : expenses.length > 0 ? (
        <ExpenseTable expenses={expenses} />
      ) : (
        <p className="flex items-center gap-2 text-blue-400">
          <IconConfetti className="size-4" />
          <span>Great news! No upcoming expenses!</span>
        </p>
      )}
    </div>
  );
};
