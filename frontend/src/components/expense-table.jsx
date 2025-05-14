'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAllAccountExpenses, getAccounts } from '@/lib/api';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function ExpenseTable({ accountId }) {
  const { data: expenses, isLoading, error } = useQuery({
    queryKey: ['expenses', accountId],
    queryFn: () => getAllAccountExpenses(accountId)
  });

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: getAccounts
  });
  if (error) {
    return <div className="text-left p-4 text-red-500">Error loading expenses: {error.message}</div>;
  }

  if (!expenses || expenses.length === 0) {
    return (
      <div className="text-left p-4">
        <p className="text-gray-500">No expenses found for this account.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Expenses</h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-left">Name</TableHead>
            <TableHead className="text-left">Description</TableHead>
            <TableHead className="text-left">Amount</TableHead>
            <TableHead className="text-left">Date</TableHead>
            <TableHead className="text-left">End Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow key={expense.id}>
              <TableCell className="font-medium text-left">
                {expense.name}
                {expense.to_account_id && expense.to_account_id !== accountId && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <span className="text-red-500 ml-2 cursor-help">→</span>
                    </PopoverTrigger>
                    <PopoverContent className="w-60">
                      <div className="space-y-2">
                        <h4 className="font-medium">Outgoing Transfer</h4>
                        <p className="text-sm text-muted-foreground">
                          Transfer to {accounts?.find(a => a.id === expense.to_account_id)?.name || 'another account'}
                        </p>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
                {expense.from_account_id && expense.from_account_id !== accountId && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <span className="text-green-500 ml-2 cursor-help">←</span>
                    </PopoverTrigger>
                    <PopoverContent className="w-60">
                      <div className="space-y-2">
                        <h4 className="font-medium">Incoming Transfer</h4>
                        <p className="text-sm text-muted-foreground">
                          Transfer from {accounts?.find(a => a.id === expense.from_account_id)?.name || 'another account'}
                        </p>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </TableCell>
              <TableCell className="text-left">{expense.description}</TableCell>
              <TableCell className={`text-left ${(expense.to_account_id === accountId ? -expense.amount : expense.amount) < 0 ? 'text-red-500' : 'text-green-500'}`}>
                {(expense.to_account_id === accountId ? -expense.amount : expense.amount) < 0 ? '-' : ''}${Math.abs(expense.to_account_id === accountId ? -expense.amount : expense.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </TableCell>
              <TableCell className="text-left">
                {expense.start_date ? (
                  expense.type === 'one_time' ? (
                    `On ${new Date(expense.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                  ) : (
                    `Every ${expense.frequency.value} ${expense.frequency.unit} starting ${new Date(expense.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                  )
                ) : '-'}
              </TableCell>
              <TableCell className="text-left">
                {expense.end_date ? new Date(expense.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 
                  expense.type === 'one_time' ? '-' : <span className="text-gray-400">Never</span>}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
