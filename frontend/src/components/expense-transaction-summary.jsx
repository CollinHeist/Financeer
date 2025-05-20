'use client';

import { useQuery } from '@tanstack/react-query';
import { getExpenseTransactions } from '@/lib/api';
import TransactionSummaryDialog from './transaction-summary-dialog';
import TransactionSummaryInline from './transaction-summary-inline';

export default function ExpenseTransactionSummary({ 
  isOpen, 
  onOpenChange, 
  expenseId, 
  expenseName, 
  expenseAmount, 
  expenseFrequency,
  isInline = false 
}) {
  const { data: transactions, isLoading, error } = useQuery({
    queryKey: ['expenseTransactions', expenseId],
    queryFn: () => getExpenseTransactions(expenseId),
    enabled: !!expenseId && (isOpen || isInline),
  });

  if (isInline) {
    return (
      <TransactionSummaryInline
        title={expenseName || 'Expense'}
        transactions={transactions}
        isLoading={isLoading}
        error={error}
        budgetAmount={expenseAmount}
        frequency={expenseFrequency}
        reversedYAxis={true}
      />
    );
  }

  return (
    <TransactionSummaryDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={expenseName || 'Expense'}
      transactions={transactions}
      isLoading={isLoading}
      error={error}
      budgetAmount={expenseAmount}
      frequency={expenseFrequency}
      reversedYAxis={true}
    />
  );
} 