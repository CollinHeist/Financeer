'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IconPlus, IconTrash, IconInfoCircle, IconBraces } from '@tabler/icons-react';
import { getExpenseById, getIncomeById, patchExpense, patchIncome, getTransactionsFromFilters } from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function TransactionFilterDialog({ isOpen, onOpenChange, expenseId, incomeId }) {
  const queryClient = useQueryClient();
  const [filterGroups, setFilterGroups] = useState([]);
  const [previewTransactions, setPreviewTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('edit');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const type = expenseId ? 'expense' : 'income';
  const id = expenseId || incomeId;

  const { data: item, isLoading: itemLoading } = useQuery({
    queryKey: [type, id],
    queryFn: () => type === 'expense' ? getExpenseById(id) : getIncomeById(id),
    enabled: isOpen && !!id,
  });

  useEffect(() => {
    if (item?.transaction_filters) {
      // Convert API filter groups to our UI format
      const groups = item.transaction_filters.map((group, groupIndex) => ({
        id: `group-${groupIndex}`,
        filters: group.map((filter, filterIndex) => ({
          ...filter,
          id: `filter-${groupIndex}-${filterIndex}` // Add temporary ID for UI
        }))
      }));
      
      setFilterGroups(groups.length > 0 ? groups : [createEmptyGroup()]);
    } else {
      setFilterGroups([createEmptyGroup()]);
    }
  }, [item]);

  const updateItemMutation = useMutation({
    mutationFn: (data) => type === 'expense' ? patchExpense(id, data) : patchIncome(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries([type, id]);
      queryClient.invalidateQueries([`${type}s`]);
      onOpenChange(false);
    },
    onError: (error) => {
      console.error(`Error updating ${type} filters:`, error);
    },
  });

  const createEmptyFilter = () => ({
    id: `filter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    on: 'description',
    type: 'contains',
    value: ''
  });

  const createEmptyGroup = () => ({
    id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    filters: [createEmptyFilter()]
  });

  const handleAddGroup = () => {
    setFilterGroups([...filterGroups, createEmptyGroup()]);
  };

  const handleRemoveGroup = (groupId) => {
    setFilterGroups(filterGroups.filter(group => group.id !== groupId));
  };

  const handleAddFilter = (groupId) => {
    setFilterGroups(filterGroups.map(group => {
      if (group.id === groupId) {
        return { ...group, filters: [...group.filters, createEmptyFilter()] };
      }
      return group;
    }));
  };

  const handleRemoveFilter = (groupId, filterId) => {
    setFilterGroups(filterGroups.map(group => {
      if (group.id === groupId) {
        // Only remove the filter if there's more than one in the group
        if (group.filters.length > 1) {
          return { 
            ...group, 
            filters: group.filters.filter(filter => filter.id !== filterId) 
          };
        }
      }
      return group;
    }));
  };

  const handleFilterChange = (groupId, filterId, field, value) => {
    setFilterGroups(filterGroups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          filters: group.filters.map(filter => {
            if (filter.id === filterId) {
              return { ...filter, [field]: value };
            }
            return filter;
          })
        };
      }
      return group;
    }));
  };

  const handleSave = () => {
    // Convert UI filter groups to API format - exclude empty groups and filters
    const validGroups = filterGroups
      .map(group => (
        group.filters
          .filter(filter => filter.value.trim() !== '')
          .map(({ id, ...filter }) => filter) // Remove temporary IDs
      ))
      .filter(group => group.length > 0); // Remove empty groups
    
    updateItemMutation.mutate({
      transaction_filters: validGroups
    });
  };

  const handlePreviewFilters = async () => {
    // Convert UI filter groups to API format - exclude empty groups and filters
    const validGroups = filterGroups
      .map(group => (
        group.filters
          .filter(filter => filter.value.trim() !== '')
          .map(({ id, ...filter }) => filter) // Remove temporary IDs
      ))
      .filter(group => group.length > 0); // Remove empty groups
    
    if (validGroups.length === 0) {
      setPreviewTransactions([]);
      return;
    }
    
    try {
      setIsPreviewLoading(true);
      const transactions = await getTransactionsFromFilters(id, validGroups, type);
      setPreviewTransactions(transactions);
    } catch (error) {
      console.error('Error previewing filters:', error);
      setPreviewTransactions([]);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Transaction Filters for {item?.name}</DialogTitle>
          <div className="flex items-center gap-1">
            <IconInfoCircle className="text-blue-500 h-4 w-4" />
            <p className="text-xs text-gray-500">
              Define filters to automatically match Transactions to this {type === 'expense' ? 'Expense' : 'Income'}. 
              Filters within a group use AND logic (all must match), while different groups use OR logic (any group can match).
            </p>
          </div>
        </DialogHeader>

        {itemLoading ? (
          <div className="py-10 text-center">Loading...</div>
        ) : (
          <div className="py-4">
            <Tabs defaultValue="edit" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="edit">Edit Filters</TabsTrigger>
                <TabsTrigger value="preview">Preview Matches</TabsTrigger>
              </TabsList>
              
              <TabsContent value="edit" className="space-y-4 py-4">
                <div className="space-y-6">
                  {filterGroups.map((group, groupIndex) => (
                    <Card key={group.id} className="border-muted">
                      <CardHeader className="pb-3 pt-4 px-4 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <IconBraces className="h-4 w-4" />
                          <span>Filter Group {groupIndex + 1}</span>
                          <Badge variant="outline" className="ml-2">
                            {group.filters.length} filter{group.filters.length !== 1 ? 's' : ''}
                          </Badge>
                        </CardTitle>
                        
                        {filterGroups.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleRemoveGroup(group.id)}
                          >
                            <IconTrash className="h-3.5 w-3.5 mr-1" />
                            Remove Group
                          </Button>
                        )}
                      </CardHeader>
                      
                      <CardContent className="px-4 pb-4 pt-0 space-y-3">
                        {group.filters.map((filter, filterIndex) => (
                          <div key={filter.id} className="flex items-end gap-2">
                            <div className="flex-1">
                              {filterIndex === 0 && (
                                <Label htmlFor={`filter-field-${filter.id}`} className="text-xs">Transaction Field</Label>
                              )}
                              <Select
                                id={`filter-field-${filter.id}`}
                                value={filter.on}
                                onValueChange={(value) => handleFilterChange(group.id, filter.id, 'on', value)}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Select field" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="description">Description</SelectItem>
                                  <SelectItem value="note">Note</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="flex-1">
                              {filterIndex === 0 && (
                                <Label htmlFor={`filter-type-${filter.id}`} className="text-xs">Match Type</Label>
                              )}
                              <Select
                                id={`filter-type-${filter.id}`}
                                value={filter.type}
                                onValueChange={(value) => handleFilterChange(group.id, filter.id, 'type', value)}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="contains">Contains</SelectItem>
                                  <SelectItem value="regex">Regex</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="flex-[2]">
                              {filterIndex === 0 && (
                                <Label htmlFor={`filter-value-${filter.id}`} className="text-xs">Value</Label>
                              )}
                              <div className="flex gap-2">
                                <Input
                                  id={`filter-value-${filter.id}`}
                                  value={filter.value}
                                  onChange={(e) => handleFilterChange(group.id, filter.id, 'value', e.target.value)}
                                  placeholder={filter.type === 'regex' ? "Regular expression" : "Text to search for"}
                                  className="h-8"
                                />
                                <Button 
                                  variant="outline" 
                                  size="icon"
                                  type="button"
                                  onClick={() => handleRemoveFilter(group.id, filter.id)}
                                  disabled={group.filters.length === 1}
                                  className="h-8 w-8"
                                >
                                  <IconTrash className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddFilter(group.id)}
                          className="mt-2"
                        >
                          <IconPlus className="mr-1 h-3.5 w-3.5" />
                          Add Filter to Group
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                  
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleAddGroup}
                  >
                    <IconPlus className="mr-2 h-4 w-4" />
                    Add Filter Group
                  </Button>
                  
                  <div className="pt-4 flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSave}
                      disabled={updateItemMutation.isLoading}
                    >
                      {updateItemMutation.isLoading ? 'Saving...' : 'Save Filters'}
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="preview" className="space-y-4 py-4">
                <div className="flex justify-end">
                  <Button 
                    onClick={handlePreviewFilters}
                    disabled={isPreviewLoading}
                    variant="outline"
                  >
                    {isPreviewLoading ? 'Loading...' : 'Refresh Preview'}
                  </Button>
                </div>
                
                {isPreviewLoading ? (
                  <div className="py-10 text-center">Loading matching transactions...</div>
                ) : previewTransactions.length > 0 ? (
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="text-right p-2">Date</th>
                          <th className="text-left p-2">Description</th>
                          <th className="text-left p-2">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewTransactions.map((transaction) => (
                          <tr key={transaction.id} className="border-t">
                            <td className="p-2 text-right">
                              {new Date(transaction.date).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })}
                            </td>
                            <td className="p-2">
                              <div className="line-clamp-1">{transaction.description}</div>
                              {transaction.note && (
                                <div className="text-sm text-gray-500 line-clamp-1">{transaction.note}</div>
                              )}
                            </td>
                            <td className={`p-2 ${transaction.amount < 0 ? 'text-red-500' : 'text-green-500'}`}>
                              ${Math.abs(transaction.amount).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-10 text-center text-gray-500">
                    No transactions match the current filters
                  </div>
                )}
                
                <div className="pt-4 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab('edit')}
                  >
                    Back to Editing
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSave}
                    disabled={updateItemMutation.isLoading}
                  >
                    {updateItemMutation.isLoading ? 'Saving...' : 'Save Filters'}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 