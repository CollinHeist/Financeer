'use client';

import { IconConfetti } from "@tabler/icons-react";
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';

import AccountSummary from "@/components/AccountSummary";
import UpcomingTransactionTable from '@/components/UpcomingTransactionTable';
import DailyBalance from '@/components/DailyBalance';
import DailyComparison from '@/components/cashflow/daily-comparison';
import MonthlySnapshot from '@/components/accounts/monthly-snapshot';

import { getAccount } from '@/lib/api/accounts';
import { getUpcomingAccountTransactions } from '@/lib/api/transactions';

export default function AccountPage() {
  const { account_id } = useParams();
  const [timeFilter, setTimeFilter] = useState('month');
  const [historicalRange, setHistoricalRange] = useState('3months');

  // Calculate days based on selected time filter
  const getDays = () => {
    switch (timeFilter) {
      case 'week': return 7;
      case 'month': return 30;
      case 'threeMonths': return 90;
      default: return 30;
    }
  };

  // Calculate historical date range
  const getHistoricalDates = () => {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (historicalRange) {
      case '3months':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case '6months':
        startDate.setMonth(endDate.getMonth() - 6);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(endDate.getMonth() - 3);
    }
    
    return { startDate, endDate };
  };

  // Get stable date values for the query
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = getDays();
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + days);

  // Get historical date range
  const { startDate, endDate: historicalEndDate } = getHistoricalDates();

  // Fetch account data
  const { data: accountData, isLoading: accountLoading } = useQuery({
    queryKey: ['account', account_id],
    queryFn: () => getAccount(account_id),
    enabled: !!account_id,
  });

  // Fetch upcoming transaction data
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions', account_id, timeFilter, today.toISOString(), endDate.toISOString()],
    queryFn: () => getUpcomingAccountTransactions(account_id, days),
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    enabled: !!account_id,
  });

  const loading = accountLoading || transactionsLoading;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Account Details</h1>
      <AccountSummary accountId={account_id} />
      
      <DailyBalance accountId={account_id} days={days} />
      <MonthlySnapshot accountId={account_id} />

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Daily Expense Comparison</h2>
          <div className="flex space-x-2">
            <button 
              onClick={() => setHistoricalRange('3months')}
              className={`px-3 py-1.5 text-sm rounded-md ${historicalRange === '3months' 
                ? 'bg-blue-500 text-white' 
                : 'bg-default-100 text-foreground/60'}`}
            >
              3 Months
            </button>
            <button 
              onClick={() => setHistoricalRange('6months')}
              className={`px-3 py-1.5 text-sm rounded-md ${historicalRange === '6months' 
                ? 'bg-blue-500 text-white' 
                : 'bg-default-100 text-foreground/60'}`}
            >
              6 Months
            </button>
            <button 
              onClick={() => setHistoricalRange('year')}
              className={`px-3 py-1.5 text-sm rounded-md ${historicalRange === 'year' 
                ? 'bg-blue-500 text-white' 
                : 'bg-default-100 text-foreground/60'}`}
            >
              1 Year
            </button>
          </div>
        </div>
        <DailyComparison 
          accountId={account_id} 
          startDate={startDate}
          endDate={historicalEndDate}
        />
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Upcoming Transactions</h2>
        <div className="flex space-x-2">
          <button 
            onClick={() => setTimeFilter('week')}
            className={`px-3 py-1.5 text-sm rounded-md ${timeFilter === 'week' 
              ? 'bg-blue-500 text-white' 
              : 'bg-default-100 text-foreground/60'}`}
          >
            Next Week
          </button>
          <button 
            onClick={() => setTimeFilter('month')}
            className={`px-3 py-1.5 text-sm rounded-md ${timeFilter === 'month' 
              ? 'bg-blue-500 text-white' 
              : 'bg-default-100 text-foreground/60'}`}
          >
            Next Month
          </button>
          <button 
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
      ) : transactions.length > 0 ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={timeFilter}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <UpcomingTransactionTable transactions={transactions} />
          </motion.div>
        </AnimatePresence>
      ) : (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-blue-400"
        >
          <IconConfetti className="size-4" />
          <span>Great news! No upcoming transactions!</span>
        </motion.p>
      )}
    </div>
  );
};
