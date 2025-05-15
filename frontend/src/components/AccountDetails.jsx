'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { 
  getAccountSummary, 
  getUpcomingAccountTransactions 
} from '@/lib/api';

import AccountSummary from './AccountSummary';
import { ExpenseTable } from './expense-table';
import { IncomeTable } from './IncomeTable';
import TransactionTable from './TransactionTable';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function AccountDetails() {
  const router = useRouter();
  const params = useParams();
  const accountId = params.id;
  const [transactionDays, setTransactionDays] = useState(14);
  
  // Debug: Log the accountId to check if it's being properly extracted
  useEffect(() => {
    console.log('AccountDetails - Account ID:', accountId);
  }, [accountId]);
  
  // Fetch account summary (balance, income, expenses)
  const { 
    data: summary, 
    isLoading: summaryLoading,
    error: summaryError 
  } = useQuery({
    queryKey: ['accountSummary', accountId],
    queryFn: () => {
      console.log('Fetching account summary for ID:', accountId);
      return getAccountSummary(accountId);
    },
    enabled: !!accountId,
    onError: (error) => {
      console.error('Error fetching account summary:', error);
    }
  });

  // Debug: Log the summary data when it changes
  useEffect(() => {
    console.log('AccountDetails - Summary data:', summary);
  }, [summary]);

  // Fetch upcoming transactions
  const { 
    data: transactions, 
    isLoading: transactionsLoading,
    error: transactionsError 
  } = useQuery({
    queryKey: ['accountTransactions', accountId, transactionDays],
    queryFn: () => getUpcomingAccountTransactions(accountId, transactionDays),
    enabled: !!accountId
  });

  // Handle loading states
  if (summaryLoading) {
    return (
      <div className="w-full flex justify-center p-8">
        <div className="text-center">
          <p className="text-muted-foreground">Loading account information...</p>
        </div>
      </div>
    );
  }

  // Handle errors
  if (summaryError) {
    return (
      <div className="w-full flex justify-center p-8">
        <div className="text-center text-red-500">
          <p>Error loading account details: {summaryError.message}</p>
          <Button 
            variant="outline" 
            onClick={() => router.push('/accounts')}
            className="mt-4"
          >
            Back to Accounts
          </Button>
        </div>
      </div>
    );
  }

  // Handle case when summary is not found
  if (!summary) {
    return (
      <div className="w-full flex justify-center p-8">
        <div className="text-center">
          <p className="text-muted-foreground">Account summary not found</p>
          <Button 
            variant="outline" 
            onClick={() => router.push('/accounts')}
            className="mt-4"
          >
            Back to Accounts
          </Button>
        </div>
      </div>
    );
  }

  // Prepare data for the AccountSummary component
  const summaryData = {
    name: summary.account_name,
    balance: summary.current_balance || 0,
    income: summary.monthly_income || 0,
    expenses: summary.monthly_expenses || 0
  };

  return (
    <div className="w-full space-y-6">
      {/* Account Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">{summary.account_name}</h1>
          <p className="text-muted-foreground">
            {summary.account_type}{' '}
            {summary.account_number && (
              <span>• {summary.account_number}</span>
            )}
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => router.push('/accounts')}
        >
          Back to Accounts
        </Button>
      </div>

      {/* Account Summary Card */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        <div className="md:col-span-1">
          <AccountSummary data={summaryData} />
        </div>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Upcoming Transactions</CardTitle>
            <CardDescription>
              Transactions for the next {transactionDays} days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <p className="text-center text-muted-foreground">Loading transactions...</p>
            ) : transactionsError ? (
              <p className="text-center text-red-500">Error loading transactions</p>
            ) : !transactions || transactions.length === 0 ? (
              <p className="text-center text-muted-foreground">No upcoming transactions found</p>
            ) : (
              <TransactionTable transactions={transactions} />
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setTransactionDays(Math.max(7, transactionDays - 7))}
              disabled={transactionDays <= 7}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Fewer Days
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setTransactionDays(transactionDays + 7)}
            >
              More Days
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Tabs for Expenses and Income */}
      <Tabs defaultValue="expenses" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
        </TabsList>
        <TabsContent value="expenses" className="mt-4">
          <ExpenseTable accountId={accountId} />
        </TabsContent>
        <TabsContent value="income" className="mt-4">
          <IncomeTable accountId={accountId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
