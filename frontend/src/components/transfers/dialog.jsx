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
import { IconInfoCircle } from '@tabler/icons-react';
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { getAllAccounts } from '@/lib/api/accounts';
import { createTransfer, patchTransfer, getTransferById } from '@/lib/api/transfers';

export default function TransferDialog({ isOpen, onOpenChange, transferId = null }) {
  const isEditMode = !!transferId;
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    from_account_id: '',
    to_account_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    payoff_balance: false,
    frequency_unit: '',
    frequency_value: ''
  });
  const [errors, setErrors] = useState({});

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: getAllAccounts,
    enabled: isOpen
  });

  const { data: existingTransfer, isLoading: transferLoading } = useQuery({
    queryKey: ['transfer', transferId],
    queryFn: () => getTransferById(transferId),
    enabled: isOpen && !!transferId,
  });

  useEffect(() => {
    if (existingTransfer) {
      setFormData({
        name: existingTransfer.name,
        description: existingTransfer.description || '',
        amount: existingTransfer.payoff_balance ? '' : existingTransfer.amount.toString(),
        from_account_id: existingTransfer.from_account_id.toString(),
        to_account_id: existingTransfer.to_account_id.toString(),
        start_date: existingTransfer.start_date.split('T')[0],
        end_date: existingTransfer.end_date ? existingTransfer.end_date.split('T')[0] : '',
        payoff_balance: existingTransfer.payoff_balance,
        frequency_unit: existingTransfer.frequency?.unit || '',
        frequency_value: existingTransfer.frequency?.value?.toString() || ''
      });
    }
  }, [existingTransfer]);

  const createTransferMutation = useMutation({
    mutationFn: createTransfer,
    onSuccess: () => {
      queryClient.invalidateQueries(['transfers']);
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      console.error('Error creating transfer:', error);
    },
  });

  const updateTransferMutation = useMutation({
    mutationFn: (data) => patchTransfer(transferId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['transfers']);
      queryClient.invalidateQueries(['transfer', transferId]);
      onOpenChange(false);
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      amount: '',
      from_account_id: '',
      to_account_id: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      payoff_balance: false,
      frequency_unit: '',
      frequency_value: ''
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.from_account_id) newErrors.from_account_id = 'From Account is required';
    if (!formData.to_account_id) newErrors.to_account_id = 'To Account is required';
    if (formData.from_account_id === formData.to_account_id) {
      newErrors.to_account_id = 'From and To accounts must be different';
    }
    if (!formData.payoff_balance && (!formData.amount || isNaN(formData.amount))) {
      newErrors.amount = 'Amount must be a valid number';
    }
    if (!formData.start_date) newErrors.start_date = 'Start Date is required';
    
    // Validate frequency if either unit or value is provided
    if (formData.frequency_unit || formData.frequency_value) {
      if (!formData.frequency_unit) newErrors.frequency_unit = 'Frequency unit is required';
      if (!formData.frequency_value || isNaN(formData.frequency_value) || parseInt(formData.frequency_value) <= 0) {
        newErrors.frequency_value = 'Frequency value must be a positive number';
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
    
    const transferData = {
      ...formData,
      amount: formData.payoff_balance ? 1 : parseFloat(formData.amount),
      from_account_id: parseInt(formData.from_account_id),
      to_account_id: parseInt(formData.to_account_id),
      end_date: formData.end_date || null,
      frequency: (formData.frequency_unit && formData.frequency_value) ? {
        unit: formData.frequency_unit,
        value: parseInt(formData.frequency_value)
      } : null
    };
    
    if (isEditMode) {
      updateTransferMutation.mutate(transferData);
    } else {
      createTransferMutation.mutate(transferData);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const isLoading = createTransferMutation.isLoading || updateTransferMutation.isLoading || (isEditMode && transferLoading);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetForm();
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Transfer' : 'Create New Transfer'}</DialogTitle>
          {/* <DialogDescription>
            Transfers move money between accounts.
          </DialogDescription> */}
        </DialogHeader>

        {isLoading && !isEditMode ? (
          <div className="py-10 text-center">Loading...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">Name</label>
              <Input
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
              <label htmlFor="description" className="text-sm font-medium">Description (Optional)</label>
              <Input
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-between ${errors.from_account_id ? 'border-red-500' : ''}`}
                    >
                      {formData.from_account_id
                        ? accounts?.find(a => a.id.toString() === formData.from_account_id)?.name || 'Select an account'
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
                            from_account_id: account.id.toString()
                          }));
                          if (errors.from_account_id) {
                            setErrors(prev => ({ ...prev, from_account_id: undefined }));
                          }
                        }}
                      >
                        {account.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                {errors.from_account_id && <p className="text-xs text-red-500">{errors.from_account_id}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="to_account_id" className="text-sm font-medium">To Account</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-between ${errors.to_account_id ? 'border-red-500' : ''}`}
                    >
                      {formData.to_account_id
                        ? accounts?.find(a => a.id.toString() === formData.to_account_id)?.name || 'Select an account'
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
                            to_account_id: account.id.toString()
                          }));
                          if (errors.to_account_id) {
                            setErrors(prev => ({ ...prev, to_account_id: undefined }));
                          }
                        }}
                      >
                        {account.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                {errors.to_account_id && <p className="text-xs text-red-500">{errors.to_account_id}</p>}
              </div>
            </div>

            {formData.to_account_id && accounts?.find(a => a.id.toString() === formData.to_account_id)?.type === 'credit' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    type="checkbox"
                    id="payoff_balance"
                    name="payoff_balance"
                    checked={formData.payoff_balance}
                    onChange={handleChange}
                    className="h-4 w-4"
                  />
                  <label htmlFor="payoff_balance" className="text-sm font-medium">Pay off card balance</label>
                </div>
              </div>
            )}

            {(!formData.payoff_balance || (formData.to_account_id && accounts?.find(a => a.id.toString() === formData.to_account_id)?.type !== 'credit')) && (
              <div className="space-y-2">
                <label htmlFor="amount" className="text-sm font-medium">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                  <Input
                    type="number"
                    id="amount"
                    name="amount"
                    min="0.01"
                    value={formData.amount}
                    onChange={handleChange}
                    step="0.01"
                    className={`w-full p-2 pl-6 border rounded-md ${errors.amount ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.amount && <p className="text-xs text-red-500">{errors.amount}</p>}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="start_date" className="text-sm font-medium">Start Date</label>
                <Input
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
                <Input
                  type="date"
                  id="end_date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="frequency" className="text-sm font-medium">Frequency (Optional)</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  id="frequency_value"
                  name="frequency_value"
                  value={formData.frequency_value}
                  onChange={handleChange}
                  min="1"
                  className={`w-1/3 p-2 border rounded-md ${errors.frequency_value ? 'border-red-500' : ''}`}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-2/3 justify-between ${errors.frequency_unit ? 'border-red-500' : ''}`}
                    >
                      {formData.frequency_unit
                        ? formData.frequency_unit.charAt(0).toUpperCase() + formData.frequency_unit.slice(1)
                        : 'Select unit'}
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {['days', 'weeks', 'months', 'years'].map(unit => (
                      <DropdownMenuItem
                        key={unit}
                        onSelect={() => {
                          setFormData(prev => ({
                            ...prev,
                            frequency_unit: unit
                          }));
                          if (errors.frequency_unit) {
                            setErrors(prev => ({ ...prev, frequency_unit: undefined }));
                          }
                        }}
                      >
                        {unit.charAt(0).toUpperCase() + unit.slice(1)}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {(errors.frequency_value || errors.frequency_unit) && (
                <p className="text-xs text-red-500">
                  {errors.frequency_value || errors.frequency_unit}
                </p>
              )}
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
                {isLoading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Transfer' : 'Create Transfer')}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
} 