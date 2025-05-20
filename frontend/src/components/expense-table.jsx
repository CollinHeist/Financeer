'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BarChart2,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-react';
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
import { Button } from "@/components/ui/button";
import { useState } from 'react';
import { getAllAccountExpenses, deleteExpense } from '@/lib/api';
import { DeleteConfirmation } from "@/components/ui/delete-confirmation";
import ExpenseDialog from './ExpenseDialog';
import TransactionFilterDialog from './TransactionFilterDialog';
import ExpenseTransactionSummary from './expense-transaction-summary';
import { IconFilterDollar } from '@tabler/icons-react';
import { Badge } from "@/components/ui/badge";

export function ExpenseTable({ accountId }) {
  const queryClient = useQueryClient();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [expenseToFilter, setExpenseToFilter] = useState(null);
  const [expandedExpenseId, setExpandedExpenseId] = useState(null);

  const { data: expenses, isLoading, error } = useQuery({
    queryKey: ['expenses', accountId],
    queryFn: () => getAllAccountExpenses(accountId)
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (expenseId) => deleteExpense(expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses', accountId]);
      setDeleteConfirmOpen(false);
      setExpenseToDelete(null);
    },
    onError: (error) => {
      console.error('Error deleting expense:', error);
    }
  });

  const handleDelete = (expense) => {
    setExpenseToDelete(expense);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (expenseToDelete) {
      deleteExpenseMutation.mutate(expenseToDelete.id);
    }
  };

  const handleEdit = (expense) => {
    setExpenseToEdit(expense);
    setEditDialogOpen(true);
  };

  const handleEditDialogClose = (open) => {
    setEditDialogOpen(open);
    if (!open) {
      setExpenseToEdit(null);
    }
  };

  const handleFilter = (expense) => {
    setExpenseToFilter(expense);
    setFilterDialogOpen(true);
  };
  
  const handleFilterDialogClose = (open) => {
    setFilterDialogOpen(open);
    if (!open) {
      setExpenseToFilter(null);
    }
  };

  const handleSummary = (expense) => {
    setExpandedExpenseId(expandedExpenseId === expense.id ? null : expense.id);
  };

  if (error) {
    return <div className="text-left p-4 text-red-500">Error loading Expenses: {error.message}</div>;
  }

  if (!expenses || expenses.length === 0) {
    return (
      <div className="text-left p-4">
        <p className="text-gray-500">No Expenses found for this Account.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Expenses</h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
          <TableHead className="text-center">
              <BarChart2 className="h-4 w-4 mx-auto" />
            </TableHead>
            <TableHead className="text-left">Name</TableHead>
            <TableHead className="text-left">Description</TableHead>
            <TableHead className="text-left">Amount</TableHead>
            <TableHead className="text-left">Date</TableHead>
            <TableHead className="text-left">End Date</TableHead>
            <TableHead className="text-left">Filters</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => (
            <>
              <TableRow key={expense.id}>
                <TableCell className="text-center">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => handleSummary(expense)}
                  >
                    {expandedExpenseId === expense.id ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <span className="sr-only">Toggle Summary</span>
                  </Button>
                </TableCell>
                <TableCell className="font-medium text-left">
                  {expense.name}
                </TableCell>
                <TableCell className="text-left">{expense.description || '-'}</TableCell>
                <TableCell className={`text-left ${expense.amount < 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {expense.amount < 0 ? '-' : ''}${Math.abs(expense.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-left">
                  {expense.start_date ? (
                    expense.type === 'one_time' ? (
                      `On ${new Date(expense.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                    ) : (
                      `Every ${expense.frequency.value} ${expense.frequency.unit} starting ${new Date(expense.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                    )
                  ) : '-'}
                </TableCell>
                <TableCell className="text-left">
                  {expense.end_date ? new Date(expense.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 
                    expense.type === 'one_time' ? '-' : <span className="text-gray-400">Never</span>}
                </TableCell>
                <TableCell className="text-left">
                  {expense.transaction_filters && expense.transaction_filters.length > 0 ? (
                    <Badge 
                      variant="outline" 
                      className="hover:bg-slate-100 cursor-pointer" 
                      onClick={() => handleFilter(expense)}
                    >
                      {expense.transaction_filters.reduce((total, group) => total + group.length, 0)}
                    </Badge>
                  ) : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(expense)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleFilter(expense)}>
                        <IconFilterDollar className="mr-2 h-4 w-4" />
                        Transaction Filters
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSummary(expense)}>
                        <BarChart2 className="mr-2 h-4 w-4" />
                        {expandedExpenseId === expense.id ? 'Hide Summary' : 'Show Summary'}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(expense)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              {expandedExpenseId === expense.id && (
                <TableRow>
                  <TableCell colSpan={8} className="p-4">
                    <ExpenseTransactionSummary
                      isInline={true}
                      expenseId={expense.id}
                      expenseName={expense.name}
                      expenseAmount={expense.amount}
                      expenseFrequency={expense.frequency}
                    />
                  </TableCell>
                </TableRow>
              )}
            </>
          ))}
        </TableBody>
      </Table>

      <DeleteConfirmation
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Expense"
        itemName={expenseToDelete?.name}
        itemType="expense"
        onConfirm={confirmDelete}
        isDeleting={deleteExpenseMutation.isLoading}
      />

      <ExpenseDialog
        isOpen={editDialogOpen}
        onOpenChange={handleEditDialogClose}
        accountId={accountId}
        expenseId={expenseToEdit?.id}
      />

      <TransactionFilterDialog
        isOpen={filterDialogOpen}
        onOpenChange={handleFilterDialogClose}
        expenseId={expenseToFilter?.id}
      />
    </div>
  );
}
