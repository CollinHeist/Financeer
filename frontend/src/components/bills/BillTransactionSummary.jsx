'use client';

import { useQuery } from '@tanstack/react-query';

import TransactionSummaryDialog from '@/components/transactions/summary-dialog';
import TransactionSummaryInline from '@/components/transactions/summary-inline';

import { getBillTransactions } from '@/lib/api/bills';

export default function BillTransactionSummary({ 
  isOpen, 
  onOpenChange, 
  billId, 
  billName, 
  billAmount, 
  billFrequency,
  isInline = false 
}) {
  const { data: transactions, isLoading, error } = useQuery({
    queryKey: ['billTransactions', billId],
    queryFn: () => getBillTransactions(billId),
    enabled: !!billId && (isOpen || isInline),
  });

  if (isInline) {
    return (
      <TransactionSummaryInline
        title={billName || 'Bill'}
        transactions={transactions}
        isLoading={isLoading}
        error={error}
        budgetAmount={billAmount}
        frequency={billFrequency}
        reversedYAxis={true}
      />
    );
  }

  return (
    <TransactionSummaryDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={billName || 'Bill'}
      transactions={transactions}
      isLoading={isLoading}
      error={error}
      budgetAmount={billAmount}
      frequency={billFrequency}
      reversedYAxis={true}
    />
  );
} 