'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconInfoCircle } from '@tabler/icons-react';

import { getAllAccounts } from '@/lib/api/accounts';
import { createBill, getBillById, patchBill } from '@/lib/api/bills';

export default function BillDialog({ isOpen, onOpenChange, accountId, billId = null }) {
  const isEditMode = !!billId;
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    type: 'one_time',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    account_id: accountId || '',
    frequencyValue: 1,
    frequencyUnit: 'months'
  });
  const [errors, setErrors] = useState({});

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: getAllAccounts,
    enabled: isOpen
  });

  const { data: existingBill, isLoading: billLoading } = useQuery({
    queryKey: ['bill', billId],
    queryFn: () => getBillById(billId),
    enabled: isOpen && !!billId,
  });

  useEffect(() => {
    if (existingBill) {
      setFormData({
        name: existingBill.name,
        description: existingBill.description || '',
        amount: existingBill.amount.toString(),
        type: existingBill.type,
        start_date: existingBill.start_date || new Date().toISOString().split('T')[0],
        end_date: existingBill.end_date || '',
        account_id: existingBill.account_id.toString(),
        frequencyValue: existingBill.frequency?.value || 1,
        frequencyUnit: existingBill.frequency?.unit || 'months'
      });
    }
  }, [existingBill]);

  const createBillMutation = useMutation({
    mutationFn: createBill,
    onSuccess: () => {
      queryClient.invalidateQueries(['bills', accountId]);
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      console.error('Error creating Bill:', error);
    },
  });

  const updateBillMutation = useMutation({
    mutationFn: (data) => patchBill(billId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['bills', accountId]);
      queryClient.invalidateQueries(['bill', billId]);
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error updating Bill:', error);
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
      account_id: accountId || '',
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
    if (!formData.account_id) newErrors.account_id = 'Account is required';
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
    
    const billData = {
      ...formData,
      amount: parseFloat(formData.amount),
      end_date: formData.end_date || null,
      frequency: formData.type === 'recurring' ? { 
        value: parseInt(formData.frequencyValue), 
        unit: formData.frequencyUnit 
      } : null
    };
    
    if (isEditMode) {
      updateBillMutation.mutate(billData);
    } else {
      createBillMutation.mutate(billData);
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

  const isLoading = createBillMutation.isLoading || updateBillMutation.isLoading || (isEditMode && billLoading);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetForm();
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Bill' : 'Create New Bill'}</DialogTitle>
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
                <label htmlFor="account_id" className="text-sm font-medium">Account</label>
                <Select
                  value={formData.account_id}
                  onValueChange={(value) => {
                    handleChange({ target: { name: 'account_id', value } });
                  }}
                >
                  <SelectTrigger className={errors.account_id ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select Account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts?.map(account => (
                      <SelectItem key={account.id} value={account.id.toString()}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.account_id && <p className="text-xs text-red-500">{errors.account_id}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="type" className="text-sm font-medium">Type</label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => {
                    handleChange({ target: { name: 'type', value } });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_time">One Time</SelectItem>
                    <SelectItem value="recurring">Recurring</SelectItem>
                  </SelectContent>
                </Select>
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
                    <Select
                      value={formData.frequencyUnit}
                      onValueChange={(value) => {
                        handleChange({ target: { name: 'frequencyUnit', value } });
                      }}
                    >
                      <SelectTrigger className={`w-2/3 ${errors.frequencyUnit ? 'border-red-500' : ''}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['days', 'weeks', 'months', 'years'].map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit.charAt(0).toUpperCase() + unit.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                {isLoading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Bill' : 'Create Bill')}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
} 