'use client';

import React from 'react';
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
import { DeleteConfirmation } from "@/components/ui/delete-confirmation";
import { IconFilterDollar } from '@tabler/icons-react';
import { Badge } from "@/components/ui/badge";

import ExpenseDialog from '@/components/expenses/dialog';
import TransactionFilterDialog from '@/components/transactions/filter-dialog';
import TransactionSummaryInline from '@/components/transactions/summary-inline';

import { formatAmount } from '@/lib/utils';
import { getAllExpenses } from '@/lib/api/expenses';
import { deleteExpense } from '@/lib/api/expenses';
import { getExpenseTransactions } from '@/lib/api/transactions';

export default function ExpenseTable() {
  const queryClient = useQueryClient();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [expenseToFilter, setExpenseToFilter] = useState(null);
  const [expandedExpenseId, setExpandedExpenseId] = useState(null);
  const [newExpenseDialogOpen, setNewExpenseDialogOpen] = useState(false);
  const frequency = { value: 1, unit: 'months' };

  const { data: expenses, isLoading, error } = useQuery({
    queryKey: ['expenses'],
    queryFn: getAllExpenses
  });

  const { data: expandedExpenseTransactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['expense-transactions', expandedExpenseId],
    queryFn: () => getExpenseTransactions(expandedExpenseId),
    enabled: !!expandedExpenseId,
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (expenseId) => deleteExpense(expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses']);
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

  if (!expenses) {
    return <div className="text-left p-4 text-gray-500">No Expenses found.</div>;
  }

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center">
              <BarChart2 className="h-4 w-4 mx-auto" />
            </TableHead>
            <TableHead className="text-left">Name</TableHead>
            <TableHead className="text-left">Description</TableHead>
            <TableHead className="text-left">Amount</TableHead>
            <TableHead className="text-left">Status</TableHead>
            <TableHead className="text-left">Rollover</TableHead>
            <TableHead className="text-left">Filters</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => (
            <React.Fragment key={expense.id}>
              <TableRow>
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
                <TableCell className="text-left text-red-500">
                  {formatAmount(expense.amount)}
                </TableCell>
                <TableCell className="text-left">
                  <Badge variant={expense.is_active ? "success" : "secondary"}>
                    {expense.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-left">
                  {expense.allow_rollover ? (
                    expense.max_rollover_amount ? (
                      `Up to $${expense.max_rollover_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    ) : (
                      'Unlimited'
                    )
                  ) : (
                    'Disabled'
                  )}
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
                    <TransactionSummaryInline
                      title={expense.name}
                      transactions={expandedExpenseTransactions || []}
                      isLoading={isLoadingTransactions}
                      error={error}
                      budgetAmount={expense.amount}
                      frequency={frequency}
                      reversedYAxis={true}
                    />
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
          <TableRow>
            <TableCell colSpan={9} className="text-center">
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setNewExpenseDialogOpen(true)}
              >
                + Add New Expense
              </Button>
            </TableCell>
          </TableRow>
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
        expenseId={expenseToEdit?.id}
      />

      <TransactionFilterDialog
        isOpen={filterDialogOpen}
        onOpenChange={handleFilterDialogClose}
        expenseId={expenseToFilter?.id}
      />

      <ExpenseDialog
        isOpen={newExpenseDialogOpen}
        onOpenChange={setNewExpenseDialogOpen}
      />
    </div>
  );
}
