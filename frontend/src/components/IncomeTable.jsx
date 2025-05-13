import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil } from 'lucide-react';
import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getAllIncomes, getAccounts, updateIncome } from '@/lib/api';

export function IncomeTable({ accountId }) {
  const queryClient = useQueryClient();
  const [editingIncome, setEditingIncome] = useState(null);
  const [formData, setFormData] = useState({});

  const { data: incomes, isLoading, error } = useQuery({
    queryKey: ['incomes'],
    queryFn: getAllIncomes
  });

  const updateIncomeMutation = useMutation({
    mutationFn: ({ incomeId, data }) => updateIncome(incomeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['incomes']);
      setEditingIncome(null);
    },
  });

  const handleEdit = (income) => {
    setEditingIncome(income.id);
    setFormData({
      name: income.name,
      amount: income.amount,
      frequency: {
        value: income.frequency?.value || 1,
        unit: income.frequency?.unit?.toLowerCase() || 'months'
      },
      start_date: income.start_date,
      end_date: income.end_date,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingIncome) {
      updateIncomeMutation.mutate({
        incomeId: editingIncome,
        data: formData,
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'frequencyValue' || name === 'frequencyUnit') {
      setFormData(prev => ({
        ...prev,
        frequency: {
          ...prev.frequency,
          [name === 'frequencyValue' ? 'value' : 'unit']: name === 'frequencyValue' ? Number(value) : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  if (error) {
    return <div className="text-left p-4 text-red-500">Error loading incomes: {error.message}</div>;
  }

  const filteredIncomes = incomes?.filter(income => income.account_id === accountId) || [];

  if (!filteredIncomes.length) {
    return (
      <div className="text-left p-4">
        <p className="text-gray-500">No incomes found for this account.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-left w-[50px]"></TableHead>
            <TableHead className="text-left">Name</TableHead>
            <TableHead className="text-left">Amount</TableHead>
            <TableHead className="text-left">Frequency</TableHead>
            <TableHead className="text-left">Start Date</TableHead>
            <TableHead className="text-left">End Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredIncomes.map((income) => (
            <TableRow key={income.id}>
              <TableCell className="text-left">
                <Popover open={editingIncome === income.id} onOpenChange={(open) => !open && setEditingIncome(null)}>
                  <PopoverTrigger asChild>
                    <button 
                      className="p-1 hover:bg-muted rounded-md"
                      onClick={() => handleEdit(income)}
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <h4 className="font-medium">Edit Income</h4>
                      <div className="space-y-2">
                        <div>
                          <label className="text-sm font-medium">Name</label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name || ''}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-md"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Amount</label>
                          <input
                            type="number"
                            name="amount"
                            value={formData.amount || ''}
                            onChange={handleChange}
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
                              value={formData.frequency?.value || 1}
                              onChange={handleChange}
                              min="1"
                              className="w-1/3 p-2 border rounded-md"
                            />
                            <select
                              name="frequencyUnit"
                              value={formData.frequency?.unit || 'months'}
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
                            value={formData.start_date || ''}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-md"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">End Date</label>
                          <input
                            type="date"
                            name="end_date"
                            value={formData.end_date || ''}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-md"
                          />
                        </div>
                        <button 
                          type="submit"
                          className="w-full bg-primary text-primary-foreground p-2 rounded-md hover:bg-primary/90"
                          disabled={updateIncomeMutation.isLoading}
                        >
                          {updateIncomeMutation.isLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </form>
                  </PopoverContent>
                </Popover>
              </TableCell>
              <TableCell className="font-medium text-left">{income.name}</TableCell>
              <TableCell className="text-left text-green-500">${income.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
              <TableCell className="text-left">{income.frequency ? `${income.frequency.value} ${income.frequency.unit}` : '-'}</TableCell>
              <TableCell className="text-left">{income.start_date ? new Date(income.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}</TableCell>
              <TableCell className="text-left">{income.end_date ? new Date(income.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : <span className="text-gray-400">Never</span>}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 