'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getAccounts, createExpense, patchExpense, getExpenseById } from '@/lib/api';
import { IconInfoCircle } from '@tabler/icons-react';

export default function ExpenseDialog({ isOpen, onOpenChange, accountId, expenseId = null }) {
  const isEditMode = !!expenseId;
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    type: 'one_time',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    from_account_id: accountId || '',
    to_account_id: '',
    frequencyValue: 1,
    frequencyUnit: 'months'
  });
  const [errors, setErrors] = useState({});

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: getAccounts,
    enabled: isOpen
  });

  const { data: existingExpense, isLoading: expenseLoading } = useQuery({
    queryKey: ['expense', expenseId],
    queryFn: () => getExpenseById(expenseId),
    enabled: isOpen && !!expenseId,
  });

  useEffect(() => {
    if (existingExpense) {
      setFormData({
        name: existingExpense.name,
        description: existingExpense.description || '',
        amount: existingExpense.amount.toString(),
        type: existingExpense.type,
        start_date: existingExpense.start_date || new Date().toISOString().split('T')[0],
        end_date: existingExpense.end_date || '',
        from_account_id: existingExpense.from_account_id.toString(),
        to_account_id: existingExpense.to_account_id ? existingExpense.to_account_id.toString() : '',
        frequencyValue: existingExpense.frequency?.value || 1,
        frequencyUnit: existingExpense.frequency?.unit || 'months'
      });
    }
  }, [existingExpense]);

  const createExpenseMutation = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses', accountId]);
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      console.error('Error creating expense:', error);
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: (data) => patchExpense(expenseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses', accountId]);
      queryClient.invalidateQueries(['expense', expenseId]);
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error updating expense:', error);
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      amount: '',
      type: 'one_time',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      from_account_id: accountId || '',
      to_account_id: '',
      frequencyValue: 1,
      frequencyUnit: 'months'
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.amount || isNaN(formData.amount)) {
      newErrors.amount = 'Amount must be non-zero';
    }
    if (!formData.from_account_id) newErrors.from_account_id = 'From account is required';
    if (!formData.start_date) newErrors.start_date = 'Start date is required';
    
    if (formData.type === 'recurring') {
      if (!formData.frequencyValue || parseInt(formData.frequencyValue) < 1) {
        newErrors.frequencyValue = 'Frequency value is required and must be at least 1';
      }
      if (!formData.frequencyUnit) {
        newErrors.frequencyUnit = 'Frequency unit is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const expenseData = {
      ...formData,
      amount: parseFloat(formData.amount),
      to_account_id: formData.to_account_id || null,
      end_date: formData.end_date || null,
      frequency: formData.type === 'recurring' ? { 
        value: parseInt(formData.frequencyValue), 
        unit: formData.frequencyUnit 
      } : null
    };
    
    if (isEditMode) {
      updateExpenseMutation.mutate(expenseData);
    } else {
      createExpenseMutation.mutate(expenseData);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const isLoading = createExpenseMutation.isLoading || updateExpenseMutation.isLoading || (isEditMode && expenseLoading);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetForm();
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Expense' : 'Create New Expense'}</DialogTitle>
          <div className="flex items-center gap-1">
            <IconInfoCircle className="text-blue-500 h-4 w-4" />
            <p className="text-xs text-gray-500">Use a negative amount to indicate money leaving the <span className="text-blue-500">From Account</span></p>
          </div>
        </DialogHeader>
        
        {isLoading && !isEditMode ? (
          <div className="py-10 text-center">Loading...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-md ${errors.name ? 'border-red-500' : ''}`}
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
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
                className="w-full p-2 border rounded-md"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="from_account_id" className="text-sm font-medium">From Account</label>
                <select
                  id="from_account_id"
                  name="from_account_id"
                  value={formData.from_account_id}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-md ${errors.from_account_id ? 'border-red-500' : ''}`}
                >
                  <option value="">Select Account</option>
                  {accounts?.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
                {errors.from_account_id && <p className="text-xs text-red-500">{errors.from_account_id}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="to_account_id" className="text-sm font-medium">Transfer to Account (Optional)</label>
                <select
                  id="to_account_id"
                  name="to_account_id"
                  value={formData.to_account_id}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">None</option>
                  {accounts?.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="type" className="text-sm font-medium">Type</label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="one_time">One Time</option>
                  <option value="recurring">Recurring</option>
                </select>
              </div>

              {formData.type === 'recurring' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Frequency</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      name="frequencyValue"
                      value={formData.frequencyValue}
                      onChange={handleChange}
                      min="1"
                      className={`w-1/3 p-2 border rounded-md ${errors.frequencyValue ? 'border-red-500' : ''}`}
                    />
                    <select
                      name="frequencyUnit"
                      value={formData.frequencyUnit}
                      onChange={handleChange}
                      className={`w-2/3 p-2 border rounded-md ${errors.frequencyUnit ? 'border-red-500' : ''}`}
                    >
                      <option value="days">Day(s)</option>
                      <option value="weeks">Week(s)</option>
                      <option value="months">Month(s)</option>
                      <option value="years">Year(s)</option>
                    </select>
                  </div>
                  {errors.frequencyValue && <p className="text-xs text-red-500">{errors.frequencyValue}</p>}
                  {errors.frequencyUnit && <p className="text-xs text-red-500">{errors.frequencyUnit}</p>}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="start_date" className="text-sm font-medium">Start Date</label>
                <input
                  type="date"
                  id="start_date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-md ${errors.start_date ? 'border-red-500' : ''}`}
                />
                {errors.start_date && <p className="text-xs text-red-500">{errors.start_date}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="end_date" className="text-sm font-medium">End Date (Optional)</label>
                <input
                  type="date"
                  id="end_date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                />
              </div>
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
                {isLoading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Expense' : 'Create Expense')}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
} 