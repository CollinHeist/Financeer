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
import { getAccount, createIncome } from '@/lib/api';

const NewIncomeDialog = ({ isOpen, onOpenChange, accountId }) => {
  const queryClient = useQueryClient();
  
  // Fetch account details
  const { data: account, isLoading: accountLoading } = useQuery({
    queryKey: ['account', accountId],
    queryFn: () => accountId ? getAccount(accountId) : null,
    enabled: !!accountId && isOpen, // Only fetch when dialog is open and accountId exists
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
    account_id: accountId
  });
  
  // Update account_id when accountId prop changes
  useEffect(() => {
    if (accountId) {
      setFormData(prev => ({ ...prev, account_id: accountId }));
    }
  }, [accountId]);
  
  const [error, setError] = useState(null);

  // Use the createIncome API function
  const createIncomeMutation = useMutation({
    mutationFn: createIncome,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
      queryClient.invalidateQueries({ queryKey: ['incomes', accountId] });
      onOpenChange(false);
      setFormData({
        name: '',
        amount: '',
        frequency: {
          value: 1,
          unit: 'months'
        },
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        account_id: accountId
      });
      setError(null);
    },
    onError: (err) => {
      setError(err.message || 'Failed to create income');
    }
  });

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
    
    createIncomeMutation.mutate(incomeData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Add New Income
            {account && ` for ${account.name}`}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {accountLoading ? (
            <div className="py-4 text-center text-gray-500">Loading account details...</div>
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
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  step="0.01"
                  className="w-full p-2 border rounded-md"
                />
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
            <button 
              type="button"
              className="px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
              disabled={createIncomeMutation.isPending || accountLoading}
            >
              {createIncomeMutation.isPending ? 'Creating...' : 'Create Income'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewIncomeDialog; 