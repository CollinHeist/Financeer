'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getAccount, createIncome, patchIncome, getIncomeById } from '@/lib/api';

const IncomeDialog = ({ isOpen, onOpenChange, accountId, incomeId = null }) => {
  const isEditMode = !!incomeId;
  const queryClient = useQueryClient();
  
  // Fetch account details
  const { data: account, isLoading: accountLoading } = useQuery({
    queryKey: ['account', accountId],
    queryFn: () => accountId ? getAccount(accountId) : null,
    enabled: !!accountId && isOpen, // Only fetch when dialog is open and accountId exists
  });
  
  // Fetch existing income if in edit mode
  const { data: existingIncome, isLoading: incomeLoading } = useQuery({
    queryKey: ['income', incomeId],
    queryFn: () => getIncomeById(incomeId),
    enabled: !!incomeId && isOpen, // Only fetch when dialog is open and in edit mode
  });
  
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    frequency: {
      value: 1,
      unit: 'months'
    },
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    account_id: accountId,
    raise_schedule: []
  });
  
  // Update formData when accountId prop changes
  useEffect(() => {
    if (accountId) {
      setFormData(prev => ({ ...prev, account_id: accountId }));
    }
  }, [accountId]);
  
  // Update formData when existing income is loaded
  useEffect(() => {
    if (existingIncome) {
      setFormData({
        name: existingIncome.name,
        amount: existingIncome.amount,
        frequency: existingIncome.frequency || { value: 1, unit: 'months' },
        start_date: existingIncome.start_date || new Date().toISOString().split('T')[0],
        end_date: existingIncome.end_date || '',
        account_id: existingIncome.account_id,
        raise_schedule: existingIncome.raise_schedule || []
      });
    }
  }, [existingIncome]);
  
  const [error, setError] = useState(null);

  // Use the createIncome API function
  const createIncomeMutation = useMutation({
    mutationFn: createIncome,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
      queryClient.invalidateQueries({ queryKey: ['incomes', accountId] });
      onOpenChange(false);
      resetForm();
    },
    onError: (err) => {
      setError(err.message || 'Failed to create income');
    }
  });
  
  // Use the updateIncome API function
  const updateIncomeMutation = useMutation({
    mutationFn: (data) => patchIncome(incomeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
      queryClient.invalidateQueries({ queryKey: ['incomes', accountId] });
      queryClient.invalidateQueries({ queryKey: ['income', incomeId] });
      onOpenChange(false);
    },
    onError: (err) => {
      setError(err.message || 'Failed to update income');
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      frequency: {
        value: 1,
        unit: 'months'
      },
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      account_id: accountId,
      raise_schedule: []
    });
    setError(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'frequencyValue') {
      setFormData(prev => ({
        ...prev,
        frequency: {
          ...prev.frequency,
          value: parseInt(value) || 1
        }
      }));
    } else if (name === 'frequencyUnit') {
      setFormData(prev => ({
        ...prev,
        frequency: {
          ...prev.frequency,
          unit: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Format the data according to the API requirements
    const incomeData = {
      ...formData,
      amount: parseFloat(formData.amount),
      // Include end_date only if it's not empty
      end_date: formData.end_date || null
    };
    
    if (isEditMode) {
      updateIncomeMutation.mutate(incomeData);
    } else {
      createIncomeMutation.mutate(incomeData);
    }
  };

  const isLoading = 
    accountLoading || 
    (isEditMode && incomeLoading) || 
    createIncomeMutation.isPending || 
    updateIncomeMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetForm();
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Income' : 'Add New Income'}
            {account && ` for ${account.name}`}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {isLoading && !isEditMode ? (
            <div className="py-4 text-center text-gray-500">Loading...</div>
          ) : (
            <div className="space-y-2">
              <div>
                <label className="text-sm font-medium">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Amount</label>
                <div className="relative">
                  <span className="absolute left-2 top-2">$</span>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                    step="0.01"
                    className="w-full p-2 pl-6 border rounded-md"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Frequency</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    name="frequencyValue"
                    value={formData.frequency.value}
                    onChange={handleChange}
                    min="1"
                    required
                    className="w-1/3 p-2 border rounded-md"
                  />
                  <select
                    name="frequencyUnit"
                    value={formData.frequency.unit}
                    onChange={handleChange}
                    className="w-2/3 p-2 border rounded-md"
                  >
                    <option value="days">Day(s)</option>
                    <option value="weeks">Week(s)</option>
                    <option value="months">Month(s)</option>
                    <option value="years">Year(s)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Start Date</label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="text-sm font-medium">End Date (Optional)</label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              
              {error && (
                <div className="text-red-500 text-sm p-2 bg-red-50 rounded-md">
                  {error}
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
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
              {isLoading 
                ? (isEditMode ? 'Updating...' : 'Creating...') 
                : (isEditMode ? 'Update Income' : 'Create Income')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default IncomeDialog; 