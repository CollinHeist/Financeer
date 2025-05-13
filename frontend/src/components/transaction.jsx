'use client';

import { useQuery } from '@tanstack/react-query';
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from "@heroui/react";
import { getTransactions } from '@/lib/api';

// This is a Client Component that fetches data using React Query
export default function TransactionList() {
  const { data: transactions, isLoading, error } = useQuery({
    queryKey: ['transactions'],
    queryFn: getTransactions
  });

  if (isLoading) {
    return <div className="text-center p-4">Loading transactions...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">Error loading transactions: {error.message}</div>;
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center p-4">
        <p className="text-gray-500">No transactions found.</p>
      </div>
    );
  }
  
  return (
    <div className="w-full">
      <Table aria-label="Recent transactions">
        <TableHeader>
          <TableColumn>DATE</TableColumn>
          <TableColumn>DESCRIPTION</TableColumn>
          <TableColumn>ACCOUNT</TableColumn>
          <TableColumn>AMOUNT</TableColumn>
          <TableColumn>TYPE</TableColumn>
        </TableHeader>
        <TableBody>
          {transactions.items.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
              <TableCell>{transaction.description}</TableCell>
              <TableCell>{transaction.account_name}</TableCell>
              <TableCell className={transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                ${Math.abs(transaction.amount).toFixed(2)}
              </TableCell>
              <TableCell>{transaction.type}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
