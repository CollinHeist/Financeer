import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MoreVertical, Pencil, Trash2, CalendarClock, Plus, X } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { getAllIncomes, deleteIncome, patchIncome } from '@/lib/api';
import { DeleteConfirmation } from "@/components/ui/delete-confirmation";
import IncomeDialog from '@/components/IncomeDialog';

export function IncomeTable({ accountId }) {
  const queryClient = useQueryClient();
  const [editingIncome, setEditingIncome] = useState(null);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [scheduleFormData, setScheduleFormData] = useState({ raise_schedule: [] });
  const [newChangeItem, setNewChangeItem] = useState({
    amount: 0,
    is_percentage: true,
    start_date: '',
    end_date: '',
    frequency: { value: 1, unit: 'years' },
    is_one_time: false
  });
  const [updateError, setUpdateError] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [incomeToDelete, setIncomeToDelete] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: incomes, isLoading, error } = useQuery({
    queryKey: ['incomes'],
    queryFn: getAllIncomes
  });

  const deleteIncomeMutation = useMutation({
    mutationFn: (incomeId) => deleteIncome(incomeId),
    onSuccess: () => {
      queryClient.invalidateQueries(['incomes']);
      setDeleteConfirmOpen(false);
      setIncomeToDelete(null);
    },
    onError: (error) => {
      console.error('Error deleting income:', error);
    }
  });

  const patchIncomeMutation = useMutation({
    mutationFn: ({ incomeId, data }) => patchIncome(incomeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['incomes']);
      setEditingSchedule(null);
      setUpdateError(null);
    },
    onError: (error) => {
      console.error('Error patching income:', error);
      setUpdateError(error.response?.data?.detail || 'Failed to update income');
    }
  });

  const handleEdit = (income) => {
    setEditingIncome(income);
    setIsEditDialogOpen(true);
  };

  const handleEditSchedule = (income) => {
    setScheduleFormData({
      ...income,
      raise_schedule: income.raise_schedule || [],
    });
    
    setEditingSchedule(income);
  };

  const handleChangeItemChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'amount') {
      setNewChangeItem(prev => ({
        ...prev,
        [name]: type === 'number' ? parseFloat(value) : value,
      }));
    } else if (name === 'is_percentage' || name === 'is_one_time') {
      setNewChangeItem(prev => {
        const updatedItem = {
          ...prev,
          [name]: checked,
        };
        
        // If is_one_time is checked, set frequency to null and clear end date
        if (name === 'is_one_time' && checked) {
          updatedItem.frequency = null;
          updatedItem.end_date = '';
        } else if (name === 'is_one_time' && !checked) {
          // Restore default frequency when unchecked
          updatedItem.frequency = { value: 1, unit: 'years' };
        }
        
        return updatedItem;
      });
    } else if (name === 'frequencyValue' || name === 'frequencyUnit') {
      setNewChangeItem(prev => ({
        ...prev,
        frequency: {
          ...prev.frequency,
          [name === 'frequencyValue' ? 'value' : 'unit']: name === 'frequencyValue' ? Number(value) : value
        }
      }));
    } else {
      setNewChangeItem(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const addChangeItem = () => {
    // Require a start date and non-zero raise amount
    if (!newChangeItem.start_date || !newChangeItem.amount) return;

    // Create a clean item object that matches the backend model
    const itemToAdd = {
      // Only include fields that are part of the RaiseItem model
      amount: newChangeItem.amount,
      is_percentage: newChangeItem.is_percentage,
      start_date: newChangeItem.start_date,
      end_date: newChangeItem.end_date || null,
      frequency: newChangeItem.is_one_time ? null : newChangeItem.frequency
    };
    
    setScheduleFormData(prev => ({
      ...prev,
      raise_schedule: [...prev.raise_schedule, itemToAdd]
    }));
    
    // Reset the form
    setNewChangeItem({
      amount: 0,
      is_percentage: true,
      start_date: '',
      end_date: '',
      frequency: { value: 1, unit: 'years' },
      is_one_time: false
    });
  };

  const removeRaiseItem = (index) => {
    setScheduleFormData(prev => ({
      ...prev,
      raise_schedule: prev.raise_schedule.filter((_, i) => i !== index)
    }));
  };

  const handleScheduleSubmit = (e) => {
    e.preventDefault();
    if (editingSchedule) {
      // Create a new patch data object that explicitly includes any needed fields
      const patchData = {
        // Include the main income end_date as null if no end date is specified
        end_date: editingSchedule.end_date || null,
        // Always include raise_schedule
        raise_schedule: scheduleFormData.raise_schedule.map(item => {
          // Extract only the fields that are part of the backend model
          const { 
            amount, 
            is_percentage, 
            start_date, 
            end_date, 
            frequency 
          } = item;
          
          return {
            amount,
            is_percentage,
            start_date,
            // Handle end_date for each schedule item
            end_date: end_date || null,
            frequency
          };
        })
      };

      patchIncomeMutation.mutate({
        incomeId: editingSchedule.id,
        data: patchData,
      });
    }
  };

  const handleDelete = (income) => {
    setIncomeToDelete(income);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (incomeToDelete) {
      deleteIncomeMutation.mutate(incomeToDelete.id);
    }
  };

  const handleEditDialogClose = (open) => {
    setIsEditDialogOpen(open);
    if (!open) {
      setEditingIncome(null);
    }
  };

  if (error) {
    return <div className="text-left p-4 text-red-500">Error loading incomes: {error.message}</div>;
  }

  const filteredIncomes = incomes?.filter(income => income.account_id === accountId) || [];

  if (!filteredIncomes.length) {
    return (
      <div className="text-left p-4">
        <p className="text-gray-500">No Income added to this Account.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-left">Name</TableHead>
            <TableHead className="text-left">Amount</TableHead>
            <TableHead className="text-left">Frequency</TableHead>
            <TableHead className="text-left">Start Date</TableHead>
            <TableHead className="text-left">End Date</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredIncomes.map((income) => (
            <TableRow key={income.id}>
              <TableCell className="font-medium text-left">
                {income.name}
              </TableCell>
              <TableCell className="text-left text-green-500">
                <div className="flex items-center gap-2">
                  ${(income.effective_amount || income.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  {income.raise_schedule?.length > 0 && (
                    <Badge 
                      variant="secondary" 
                      className="text-xs cursor-pointer hover:bg-secondary/80"
                      onClick={() => handleEditSchedule(income)}
                    >
                      {income.raise_schedule.length} Raise{income.raise_schedule.length === 1 ? '' : 's'}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-left">{income.frequency ? `${income.frequency.value} ${income.frequency.unit}` : '-'}</TableCell>
              <TableCell className="text-left">{income.start_date ? new Date(income.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}</TableCell>
              <TableCell className="text-left">{income.end_date ? new Date(income.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : <span className="text-gray-400">Never</span>}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger className="p-1 hover:bg-muted rounded-md">
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => handleEdit(income)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleEditSchedule(income)}>
                      <CalendarClock className="h-4 w-4 mr-2" />
                      Edit Raises
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDelete(income)}
                      className="text-red-500 focus:text-red-500"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <DeleteConfirmation
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Income"
        itemName={incomeToDelete?.name}
        itemType="income"
        onConfirm={confirmDelete}
        isDeleting={deleteIncomeMutation.isLoading}
      />

      <IncomeDialog 
        isOpen={isEditDialogOpen}
        onOpenChange={handleEditDialogClose}
        accountId={accountId}
        incomeId={editingIncome?.id}
      />

      <Dialog open={!!editingSchedule} onOpenChange={(open) => !open && setEditingSchedule(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Raise Schedule</DialogTitle>
            <DialogDescription>
              Manage scheduled raises for <span className="text-blue-600">{editingSchedule?.name}</span>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleScheduleSubmit} className="space-y-4 pt-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Current Schedule</h3>
              {scheduleFormData.raise_schedule?.length > 0 ? (
                <div className="space-y-2">
                  {scheduleFormData.raise_schedule.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded-md">
                      <div className="flex-1">
                        <div className="text-sm">
                          {item.is_percentage 
                            ? `${item.amount >= 0 ? '+' : '-'}${(Math.abs(item.amount * 100) - 100).toFixed(2)}% ${item.amount >= 0 ? 'Raise' : 'Pay Cut'}`
                            : `${item.amount >= 0 ? '+' : '-'}$${Math.abs(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${item.amount >= 0 ? 'Raise' : 'Pay Cut'}`
                          }
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(item.start_date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                          {item.end_date ? ` - ${new Date(item.end_date).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}` : ' - No end date'}
                          {item.frequency && ` • Every ${item.frequency.value} ${item.frequency.unit}`}
                          {!item.frequency && ' • One-time'}
                        </div>
                      </div>
                      <button 
                        type="button"
                        className="p-1 text-red-500 hover:bg-red-50 rounded-full"
                        onClick={() => removeRaiseItem(index)}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No scheduled raises</div>
              )}

              <div className="border-t pt-4">
                <h3 className="text-sm font-medium mb-2">Add New Raise</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <label className="text-xs font-medium">Amount</label>
                      <div className="flex">
                        <input
                          type="number"
                          name="amount"
                          value={newChangeItem.is_percentage 
                            ? ((newChangeItem.amount || 0) * 100).toFixed(2)
                            : (newChangeItem.amount || 0).toFixed(2)}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            if (newChangeItem.is_percentage) {
                              // For percentages, we want to preserve negative values
                              // and convert from percentage to decimal (e.g. -5% -> -0.05)
                              const amount = value / 100;
                              handleChangeItemChange({
                                target: { name: 'amount', value: amount, type: 'number' }
                              });
                            } else {
                              // For dollar amounts, we want to preserve negative values
                              // but ensure we're working with a number
                              handleChangeItemChange({
                                target: { name: 'amount', value: value, type: 'number' }
                              });
                            }
                          }}
                          step="0.01"
                          className="flex-1 p-2 border rounded-l-md text-sm"
                        />
                        <div className="border border-l-0 p-2 rounded-r-md bg-muted">
                          {newChangeItem.is_percentage ? '%' : '$'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      id="is_percentage"
                      name="is_percentage"
                      checked={newChangeItem.is_percentage}
                      onChange={handleChangeItemChange}
                      className="h-4 w-4"
                    />
                    <label htmlFor="is_percentage" className="text-xs">Percentage</label>
                    
                    <div className="ml-4 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is_one_time"
                        name="is_one_time"
                        checked={newChangeItem.is_one_time}
                        onChange={handleChangeItemChange}
                        className="h-4 w-4"
                      />
                      <label htmlFor="is_one_time" className="text-xs">One-Time</label>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium">Start Date</label>
                      <input
                        type="date"
                        name="start_date"
                        value={newChangeItem.start_date}
                        onChange={handleChangeItemChange}
                        className="w-full p-2 border rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium">End Date (Optional)</label>
                      <input
                        type="date"
                        name="end_date"
                        value={newChangeItem.end_date || ''}
                        onChange={handleChangeItemChange}
                        className="w-full p-2 border rounded-md text-sm"
                        disabled={newChangeItem.is_one_time}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium">Frequency {newChangeItem.is_one_time && '(Disabled for one-time changes)'}</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        name="frequencyValue"
                        value={newChangeItem.frequency?.value || 1}
                        onChange={handleChangeItemChange}
                        min="1"
                        className="w-1/3 p-2 border rounded-md text-sm"
                        disabled={newChangeItem.is_one_time}
                      />
                      <select
                        name="frequencyUnit"
                        value={newChangeItem.frequency?.unit || 'years'}
                        onChange={handleChangeItemChange}
                        className="w-2/3 p-2 border rounded-md text-sm"
                        disabled={newChangeItem.is_one_time}
                      >
                        <option value="days">Day(s)</option>
                        <option value="weeks">Week(s)</option>
                        <option value="months">Month(s)</option>
                        <option value="years">Year(s)</option>
                      </select>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={addChangeItem}
                    className="w-full p-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-md text-sm flex items-center justify-center"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Raise
                  </button>
                </div>
              </div>
              
              {updateError && (
                <div className="text-red-500 text-sm p-2 bg-red-50 rounded-md mt-4">
                  {updateError}
                </div>
              )}
            </div>
            <DialogFooter className="gap-2">
              <button 
                type="button"
                className="px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                onClick={() => setEditingSchedule(null)}
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                disabled={patchIncomeMutation.isLoading}
              >
                {patchIncomeMutation.isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 