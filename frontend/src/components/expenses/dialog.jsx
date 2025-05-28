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
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import {
  createExpense,
  patchExpense,
  getExpenseById,
} from '@/lib/api/expenses';

const ExpenseDialog = ({ isOpen, onOpenChange, expenseId = null }) => {
  const isEditMode = !!expenseId;
  const queryClient = useQueryClient();
  
  // Fetch existing expense if in edit mode
  const { data: existingExpense, isLoading: expenseLoading } = useQuery({
    queryKey: ['expense', expenseId],
    queryFn: () => getExpenseById(expenseId),
    enabled: !!expenseId && isOpen,
  });
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    is_active: true,
    allow_rollover: false,
    max_rollover_amount: null,
    transaction_filters: []
  });
  
  // Update formData when existing expense is loaded
  useEffect(() => {
    if (existingExpense) {
      setFormData({
        name: existingExpense.name,
        description: existingExpense.description || '',
        amount: existingExpense.amount,
        is_active: existingExpense.is_active,
        allow_rollover: existingExpense.allow_rollover,
        max_rollover_amount: existingExpense.max_rollover_amount,
        transaction_filters: existingExpense.transaction_filters || []
      });
    }
  }, [existingExpense]);
  
  const [error, setError] = useState(null);

  // Use the createExpense API function
  const createExpenseMutation = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      onOpenChange(false);
      resetForm();
    },
    onError: (err) => {
      setError(err.message || 'Failed to create expense');
    }
  });
  
  // Use the updateExpense API function
  const updateExpenseMutation = useMutation({
    mutationFn: (data) => patchExpense(expenseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense', expenseId] });
      onOpenChange(false);
    },
    onError: (err) => {
      setError(err.message || 'Failed to update expense');
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      amount: '',
      is_active: true,
      allow_rollover: false,
      max_rollover_amount: null,
      transaction_filters: []
    });
    setError(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Format the data according to the API requirements
    const expenseData = {
      ...formData,
      amount: parseFloat(formData.amount),
      // Convert max_rollover_amount to number if it exists
      max_rollover_amount: formData.max_rollover_amount ? parseFloat(formData.max_rollover_amount) : null
    };
    
    if (isEditMode) {
      updateExpenseMutation.mutate(expenseData);
    } else {
      createExpenseMutation.mutate(expenseData);
    }
  };

  const isLoading = 
    (isEditMode && expenseLoading) || 
    createExpenseMutation.isPending || 
    updateExpenseMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetForm();
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Expense' : 'Add New Expense'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {isLoading && !isEditMode ? (
            <div className="py-4 text-center text-gray-500">Loading...</div>
          ) : (
            <div className="space-y-2">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                  <Input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                    step="0.01"
                    className="pl-7"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="is_active" className="text-sm font-medium">Active</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => {
                    setFormData(prev => ({
                      ...prev,
                      is_active: checked
                    }));
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="allow_rollover" className="text-sm font-medium">Allow Rollover</Label>
                <Switch
                  id="allow_rollover"
                  checked={formData.allow_rollover}
                  onCheckedChange={(checked) => {
                    setFormData(prev => ({
                      ...prev,
                      allow_rollover: checked,
                      max_rollover_amount: checked ? prev.max_rollover_amount : null
                    }));
                  }}
                />
              </div>
              {formData.allow_rollover && (
                <div>
                  <label className="text-sm font-medium">Maximum Rollover Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                    <Input
                      type="number"
                      name="max_rollover_amount"
                      value={formData.max_rollover_amount || ''}
                      onChange={handleChange}
                      step="0.01"
                      className="pl-7"
                      placeholder="Leave empty for unlimited"
                    />
                  </div>
                </div>
              )}
              
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
                : (isEditMode ? 'Update Expense' : 'Create Expense')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseDialog;
