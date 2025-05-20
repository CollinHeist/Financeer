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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { getAccount, createIncome, patchIncome, getIncomeById, getAccounts } from '@/lib/api';

const IncomeDialog = ({ isOpen, onOpenChange, accountId, incomeId = null }) => {
  const isEditMode = !!incomeId;
  const queryClient = useQueryClient();
  
  // Fetch all accounts
  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: getAccounts,
    enabled: isOpen,
  });
  
  // Fetch account details if accountId is provided
  const { data: account, isLoading: accountLoading } = useQuery({
    queryKey: ['account', accountId],
    queryFn: () => accountId ? getAccount(accountId) : null,
    enabled: !!accountId && isOpen,
  });
  
  // Fetch existing income if in edit mode
  const { data: existingIncome, isLoading: incomeLoading } = useQuery({
    queryKey: ['income', incomeId],
    queryFn: () => getIncomeById(incomeId),
    enabled: !!incomeId && isOpen,
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
    account_id: accountId ? Number(accountId) : null,
    raise_schedule: []
  });
  
  // Update formData when accountId prop changes
  useEffect(() => {
    if (accountId) {
      setFormData(prev => ({ ...prev, account_id: Number(accountId) }));
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
        account_id: Number(existingIncome.account_id),
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
      account_id: accountId ? Number(accountId) : null,
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
    } else if (name === 'account_id') {
      setFormData(prev => ({
        ...prev,
        account_id: value ? Number(value) : null
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
      end_date: formData.end_date || null,
      // Ensure account_id is a number
      account_id: Number(formData.account_id)
    };
    
    if (isEditMode) {
      updateIncomeMutation.mutate(incomeData);
    } else {
      createIncomeMutation.mutate(incomeData);
    }
  };

  const isLoading = 
    accountLoading || 
    accountsLoading ||
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
                <label className="text-sm font-medium">Account</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                    >
                      {formData.account_id
                        ? accounts?.find(a => a.id === formData.account_id)?.name || 'Select an account'
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
                            account_id: account.id
                          }));
                        }}
                      >
                        {account.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
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
              <div>
                <label className="text-sm font-medium">Frequency</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    name="frequencyValue"
                    value={formData.frequency.value}
                    onChange={handleChange}
                    min="1"
                    required
                    className="w-1/3"
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-2/3 justify-between"
                      >
                        {formData.frequency.unit.charAt(0).toUpperCase() + formData.frequency.unit.slice(1)}
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {['days', 'weeks', 'months', 'years'].map((unit) => (
                        <DropdownMenuItem
                          key={unit}
                          onSelect={() => {
                            setFormData(prev => ({
                              ...prev,
                              frequency: {
                                ...prev.frequency,
                                unit
                              }
                            }));
                          }}
                        >
                          {unit.charAt(0).toUpperCase() + unit.slice(1)}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">End Date (Optional)</label>
                <Input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
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