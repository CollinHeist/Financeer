'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getAccounts, getAllExpenses, getAllIncomes, createTransaction, updateTransaction, getTransactionById } from '@/lib/api';
import { IconInfoCircle } from '@tabler/icons-react';

export default function TransactionDialog({ isOpen, onOpenChange, transactionId = null }) {
  const isEditMode = !!transactionId;
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    account_id: '',
    note: '',
    expense_id: '',
    income_id: ''
  });
  const [errors, setErrors] = useState({});

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: getAccounts,
    enabled: isOpen
  });

  const { data: expenses } = useQuery({
    queryKey: ['expenses'],
    queryFn: getAllExpenses,
    enabled: isOpen
  });

  const { data: incomes } = useQuery({
    queryKey: ['incomes'],
    queryFn: getAllIncomes,
    enabled: isOpen
  });

  const { data: existingTransaction, isLoading: transactionLoading } = useQuery({
    queryKey: ['transaction', transactionId],
    queryFn: () => getTransactionById(transactionId),
    enabled: isOpen && !!transactionId,
  });

  useEffect(() => {
    if (existingTransaction) {
      setFormData({
        date: existingTransaction.date.split('T')[0],
        description: existingTransaction.description,
        amount: Math.abs(existingTransaction.amount).toString(),
        account_id: existingTransaction.account.id.toString(),
        note: existingTransaction.note || '',
        expense_id: existingTransaction.expense?.id.toString() || '',
        income_id: existingTransaction.income?.id.toString() || ''
      });
    }
  }, [existingTransaction]);

  const createTransactionMutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions']);
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      console.error('Error creating transaction:', error);
    },
  });

  const updateTransactionMutation = useMutation({
    mutationFn: (data) => updateTransaction(transactionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['transactions']);
      queryClient.invalidateQueries(['transaction', transactionId]);
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error updating transaction:', error);
    },
  });

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: '',
      account_id: '',
      note: '',
      expense_id: '',
      income_id: ''
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.amount || isNaN(formData.amount)) {
      newErrors.amount = 'Amount must be a valid number';
    }
    if (!formData.account_id) newErrors.account_id = 'Account is required';
    if (!formData.date) newErrors.date = 'Date is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const transactionData = {
      ...formData,
      amount: parseFloat(formData.amount) * (existingTransaction?.amount < 0 ? -1 : 1),
      account_id: parseInt(formData.account_id),
      expense_id: formData.expense_id ? parseInt(formData.expense_id) : null,
      income_id: formData.income_id ? parseInt(formData.income_id) : null
    };
    
    if (isEditMode) {
      updateTransactionMutation.mutate(transactionData);
    } else {
      createTransactionMutation.mutate(transactionData);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const isLoading = createTransactionMutation.isLoading || updateTransactionMutation.isLoading || (isEditMode && transactionLoading);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetForm();
    }}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Transaction' : 'Create New Transaction'}</DialogTitle>
          <div className="flex items-center gap-1">
            <IconInfoCircle className="text-blue-500 h-4 w-4" />
            <p className="text-xs text-gray-500">Use a negative amount to indicate money leaving the account</p>
          </div>
        </DialogHeader>
        
        {isLoading && !isEditMode ? (
          <div className="py-10 text-center">Loading...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="date" className="text-sm font-medium">Date</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-md ${errors.date ? 'border-red-500' : ''}`}
                />
                {errors.date && <p className="text-xs text-red-500">{errors.date}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="amount" className="text-sm font-medium">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    step="0.01"
                    className={`w-full p-2 pl-6 border rounded-md ${errors.amount ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.amount && <p className="text-xs text-red-500">{errors.amount}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">Description</label>
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className={`w-full p-2 border rounded-md ${errors.description ? 'border-red-500' : ''}`}
              />
              {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="account_id" className="text-sm font-medium">Account</label>
              <select
                id="account_id"
                name="account_id"
                value={formData.account_id}
                onChange={handleChange}
                className={`w-full p-2 border rounded-md ${errors.account_id ? 'border-red-500' : ''}`}
              >
                <option value="">Select Account</option>
                {accounts?.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
              {errors.account_id && <p className="text-xs text-red-500">{errors.account_id}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="expense_id" className="text-sm font-medium">Expense (Optional)</label>
              <select
                id="expense_id"
                name="expense_id"
                value={formData.expense_id}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
              >
                <option value="">None</option>
                {expenses?.map(expense => (
                  <option key={expense.id} value={expense.id}>
                    {expense.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="income_id" className="text-sm font-medium">Income (Optional)</label>
              <select
                id="income_id"
                name="income_id"
                value={formData.income_id}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
              >
                <option value="">None</option>
                {incomes?.map(income => (
                  <option key={income.id} value={income.id}>
                    {income.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="note" className="text-sm font-medium">Note (Optional)</label>
              <textarea
                id="note"
                name="note"
                value={formData.note}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                rows="3"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Transaction' : 'Create Transaction')}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
} 