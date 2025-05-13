'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAllAccountExpenses, getAccounts, createExpense } from '@/lib/api';
import { IconPlus } from "@tabler/icons-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function ExpenseTable({ accountId }) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    type: 'expense',
    frequency: 'one-time',
    from_account_id: accountId,
    to_account_id: '',
  });

  const { data: expenses, isLoading, error } = useQuery({
    queryKey: ['expenses', accountId],
    queryFn: () => getAllAccountExpenses(accountId)
  });

  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: getAccounts
  });

  const createExpenseMutation = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setIsOpen(false);
      setFormData({
        name: '',
        description: '',
        amount: '',
        type: 'expense',
        frequency: 'one-time',
        from_account_id: accountId,
        to_account_id: '',
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createExpenseMutation.mutate({
      ...formData,
      amount: parseFloat(formData.amount),
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (isLoading) {
    return <div className="text-left p-4">Loading expenses...</div>;
  }

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
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <IconPlus className="h-5 w-5" />
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border rounded-md"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="amount" className="text-sm font-medium">Amount</label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full p-2 border rounded-md"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                  rows="3"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="type" className="text-sm font-medium">Type</label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                    <option value="transfer">Transfer</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="frequency" className="text-sm font-medium">Frequency</label>
                  <select
                    id="frequency"
                    name="frequency"
                    value={formData.frequency}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="one-time">One Time</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              {formData.type === 'transfer' && (
                <div className="space-y-2">
                  <label htmlFor="to_account_id" className="text-sm font-medium">To Account</label>
                  <select
                    id="to_account_id"
                    name="to_account_id"
                    value={formData.to_account_id}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Select Account</option>
                    {accounts?.map(account => (
                      account.id !== accountId && (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      )
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={createExpenseMutation.isPending}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50"
              >
                {createExpenseMutation.isPending ? 'Creating...' : 'Create Expense'}
              </button>
            </form>
          </DialogContent>
        </Dialog>
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
                    <PopoverContent className="w-80">
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
                    <PopoverContent className="w-80">
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
                  ) : expense.type === 'recurring' ? (
                    `Every ${expense.frequency.value} ${expense.frequency.unit} starting ${new Date(expense.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                  ) : expense.type === 'monthly' ? (
                    `Every month starting ${new Date(expense.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                  ) : new Date(expense.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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
