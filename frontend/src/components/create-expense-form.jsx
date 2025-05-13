'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAccounts, createExpense } from '@/lib/api';

export function CreateExpenseForm() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    type: 'expense',
    frequency: 'one-time',
    from_account_id: '',
    to_account_id: '',
  });

  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: getAccounts
  });

  const createExpenseMutation = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setFormData({
        name: '',
        description: '',
        amount: '',
        type: 'expense',
        frequency: 'one-time',
        from_account_id: '',
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

  if (accountsLoading) {
    return <div>Loading accounts...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Expense</CardTitle>
      </CardHeader>
      <CardContent>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="from_account_id" className="text-sm font-medium">From Account</label>
              <select
                id="from_account_id"
                name="from_account_id"
                value={formData.from_account_id}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded-md"
              >
                <option value="">Select Account</option>
                {accounts?.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
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
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={createExpenseMutation.isPending}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {createExpenseMutation.isPending ? 'Creating...' : 'Create Expense'}
          </button>
        </form>
      </CardContent>
    </Card>
  );
} 