'use client';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AccountSummary from "@/components/AccountSummary";
import { getAccount, getUpcomingAccountExpenses } from '@/lib/api';
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

  // Fetch expenses data
  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['expenses', account_id, timeFilter],
    queryFn: () => getUpcomingAccountExpenses(account_id, getDays()),
    enabled: !!account_id,
  });

  const loading = accountLoading || expensesLoading;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Account Details</h1>
      <AccountSummary data={accountData} />

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Upcoming Expenses</h2>
        <div className="flex space-x-2">
          <button 
            variant="outline"
            onClick={() => setTimeFilter('week')}
            className={`px-3 py-1.5 text-sm rounded-md ${timeFilter === 'week' 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-default-100 text-foreground/60'}`}
          >
            Next Week
          </button>
          <button 
            variant="outline"
            onClick={() => setTimeFilter('month')}
            className={`px-3 py-1.5 text-sm rounded-md ${timeFilter === 'month' 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-default-100 text-foreground/60'}`}
          >
            Next Month
          </button>
          <button 
            variant="outline"
            onClick={() => setTimeFilter('threeMonths')}
            className={`px-3 py-1.5 text-sm rounded-md ${timeFilter === 'threeMonths' 
              ? 'bg-primary text-primary-foreground' 
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
        <p className="text-gray-500">No upcoming expenses found for the selected time period.</p>
      )}
    </div>
  );
};
