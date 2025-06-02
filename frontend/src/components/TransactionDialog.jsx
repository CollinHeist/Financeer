'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { getAllAccounts } from '@/lib/api/accounts';
import {
  createTransaction,
  getTransactionById,
  patchTransaction,
} from '@/lib/api/transactions';


export default function TransactionDialog({ isOpen, onOpenChange, transactionId = null }) {
  const isEditMode = !!transactionId;
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    account_id: '',
    note: ''
  });
  const [errors, setErrors] = useState({});

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: getAllAccounts,
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
        note: existingTransaction.note || ''
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
    mutationFn: (data) => patchTransaction(transactionId, data),
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
      note: ''
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
      account_id: parseInt(formData.account_id)
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
          <DialogTitle>{isEditMode ? 'Edit Transaction' : 'Add New Transaction'}</DialogTitle>
          <DialogDescription>
            Use a negative amount to indicate money leaving the account
          </DialogDescription>
        </DialogHeader>
        
        {isLoading && !isEditMode ? (
          <div className="py-10 text-center">Loading...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="date" className="text-sm font-medium">Date</label>
                <Input
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
                  <Input
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
              <Input
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-between ${errors.account_id ? 'border-red-500' : ''}`}
                  >
                    {formData.account_id
                      ? accounts?.find(a => a.id.toString() === formData.account_id)?.name || 'Select an account'
                      : 'Select an account'}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full">
                  {accounts?.map(account => (
                    <DropdownMenuItem
                      key={account.id}
                      onSelect={() => {
                        setFormData(prev => ({
                          ...prev,
                          account_id: account.id.toString()
                        }));
                        if (errors.account_id) {
                          setErrors(prev => ({ ...prev, account_id: undefined }));
                        }
                      }}
                    >
                      {account.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              {errors.account_id && <p className="text-xs text-red-500">{errors.account_id}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="note" className="text-sm font-medium">Note (Optional)</label>
              <Textarea
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