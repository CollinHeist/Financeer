'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllTransactions } from '@/lib/api';
import TransactionTable from '@/components/TransactionTable';

export default function TransactionsPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);

  const {
    data,
    isLoading,
    error,
    isPreviousData
  } = useQuery({
    queryKey: ['transactions', { page, pageSize }],
    queryFn: () => getAllTransactions(page, pageSize),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    keepPreviousData: true,
    placeholderData: (previousData) => previousData,
  });

  if (error) {
    return (
      <div className="p-4 text-red-600">
        Error loading transactions: {error.message}
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Transactions</h1>
      <TransactionTable
        transactions={data?.items || []}
        page={page}
        totalPages={data?.pages || 1}
        onPageChange={setPage}
        isLoading={isLoading || isPreviousData}
      />
    </div>
  );
}
