'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { IconSearch, IconDotsVertical, IconEdit, IconTrash } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import IncomeSummaryPopover from '@/components/IncomeSummaryPopover';
import ExpenseSummaryPopover from '@/components/ExpenseSummaryPopover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQueryClient } from '@tanstack/react-query';
import { deleteTransaction } from '@/lib/api';
import { DeleteConfirmation } from "@/components/ui/delete-confirmation";
import TransactionDialog from '@/components/TransactionDialog';

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

const RelatedTransactionsCell = ({ transactions }) => {
  if (!transactions?.length) return <TableCell className="text-center">-</TableCell>;
  
  return (
    <TableCell className="text-center">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm">
            {transactions.length} Transaction{transactions.length === 1 ? '' : 's'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-100">
          <div className="space-y-2">
            <h4 className="font-medium">Related Transactions</h4>
            <div className="divide-y">
              {transactions.map((t) => (
                <div key={t.id} className="py-2 grid grid-cols-3 gap-2">
                  <span className="text-sm">{formatDate(t.date)}</span>
                  <span className="text-sm">{t.description}</span>
                  <span className={cn(
                    "text-sm text-right",
                    t.amount >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {formatCurrency(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </TableCell>
  );
};

const CategoryCell = ({ expense, income }) => {
  if (!expense && !income) return <TableCell className="text-center">-</TableCell>;
  
  if (income) {
    return (
      <TableCell className="text-center">
        <IncomeSummaryPopover income={income} />
      </TableCell>
    );
  }
  
  return (
    <TableCell className="text-center">
      <ExpenseSummaryPopover expense={expense} />
    </TableCell>
  );
};

const PaginationControls = ({ currentPage, totalPages, onPageChange }) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        Previous
      </Button>
      
      {pages.map((pageNum) => (
        <Button
          key={pageNum}
          variant={pageNum === currentPage ? "default" : "outline"}
          size="sm"
          onClick={() => onPageChange(pageNum)}
          className={cn(
            "min-w-[32px]",
            pageNum === currentPage && "bg-primary text-primary-foreground"
          )}
        >
          {pageNum}
        </Button>
      ))}
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        Next
      </Button>
    </div>
  );
};

const ActionsCell = ({ transaction }) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    try {
      await deleteTransaction(transaction.id);
      // Invalidate and refetch transactions
      await queryClient.invalidateQueries(['transactions']);
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    } finally {
      setShowDeleteDialog(false);
    }
  };

  return (
    <TableCell className="text-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <IconDotsVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
            <IconEdit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600 focus:text-red-600"
          >
            <IconTrash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteConfirmation
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        title="Delete Transaction"
        itemName={transaction.description}
        itemType="Transaction"
      />

      <TransactionDialog
        isOpen={showEditDialog}
        onOpenChange={setShowEditDialog}
        transactionId={transaction.id}
      />
    </TableCell>
  );
};

export default function TransactionTable({ 
  transactions = [], 
  page = 1,
  totalPages = 1,
  onPageChange,
  isLoading = false,
  // accounts = [],
  expenses = [],
  incomes = []
}) {
  const [sortConfig, setSortConfig] = useState({
    key: 'date',
    direction: 'desc'
  });
  const [filterValue, setFilterValue] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const accounts = useMemo(() => {
    const accountSet = new Set();
    transactions.forEach(t => {
      if (t.account?.name) accountSet.add(t.account.name);
    });
    return Array.from(accountSet);
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const matchesSearch = filterValue === '' || 
        transaction.description.toLowerCase().includes(filterValue.toLowerCase()) ||
        transaction.note.toLowerCase().includes(filterValue.toLowerCase());

      const matchesCategory = categoryFilter === 'all' ||
        (categoryFilter === 'expense' && transaction.expense) ||
        (categoryFilter === 'income' && transaction.income) ||
        (categoryFilter === 'transfer' && transaction.related_transactions?.length);

      const matchesAccount = accountFilter === 'all' ||
        transaction.account?.name === accountFilter;

      return matchesSearch && matchesCategory && matchesAccount;
    });
  }, [transactions, filterValue, categoryFilter, accountFilter]);

  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (sortConfig.key === 'date') {
        return sortConfig.direction === 'desc' 
          ? new Date(bValue) - new Date(aValue)
          : new Date(aValue) - new Date(bValue);
      }
      
      if (typeof aValue === 'number') {
        return sortConfig.direction === 'desc' ? bValue - aValue : aValue - bValue;
      }
      
      return sortConfig.direction === 'desc'
        ? String(bValue).localeCompare(String(aValue))
        : String(aValue).localeCompare(String(bValue));
    });
  }, [filteredTransactions, sortConfig]);

  const toggleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const columns = [
    { key: 'date', label: 'Date', align: 'right' },
    { key: 'description', label: 'Description', align: 'left' },
    { key: 'account', label: 'Account', align: 'center' },
    { key: 'amount', label: 'Amount', align: 'right' },
    { key: 'category', label: 'Category', sortable: false, align: 'center' },
    { key: 'related', label: 'Related', sortable: false, align: 'center' },
    { key: 'actions', label: '', sortable: false, align: 'center' }
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex-1 min-w-[200px] max-w-xl">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateDialog(true)}>
            New Transaction
          </Button>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="expense">Expenses</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="transfer">Transfers</SelectItem>
            </SelectContent>
          </Select>
          <Select value={accountFilter} onValueChange={setAccountFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Account" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Accounts</SelectItem>
              {accounts.map(account => (
                <SelectItem key={account} value={account}>{account}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    column.sortable !== false ? 'cursor-pointer select-none' : '',
                    `text-${column.align}`
                  )}
                  onClick={() => column.sortable !== false && toggleSort(column.key)}
                >
                  {column.label}
                  {column.sortable !== false && sortConfig.key === column.key && (
                    <span className="ml-2">
                      {sortConfig.direction === 'desc' ? '↓' : '↑'}
                    </span>
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center">
                  Loading transactions...
                </TableCell>
              </TableRow>
            ) : sortedTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center">
                  No transactions found
                </TableCell>
              </TableRow>
            ) : (
              sortedTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="text-right">{formatDate(transaction.date)}</TableCell>
                  <TableCell>
                    <div>{transaction.description}</div>
                    {transaction.note && (
                      <div className="text-sm text-muted-foreground">{transaction.note}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>{transaction.account.name}</TooltipTrigger>
                        <TooltipContent>
                          Account #{transaction.account.account_number || 'N/A'}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className={cn(
                    transaction.amount >= 0 ? "text-green-600" : "text-red-600",
                    "text-right"
                  )}>
                    {formatCurrency(transaction.amount)}
                  </TableCell>
                  <CategoryCell 
                    expense={transaction.expense} 
                    income={transaction.income} 
                  />
                  <RelatedTransactionsCell 
                    transactions={[...(transaction.related_transactions || []), ...(transaction.related_to_transactions || [])]}
                  />
                  <ActionsCell 
                    transaction={transaction} 
                  />
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PaginationControls
        currentPage={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />

      <TransactionDialog
        isOpen={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}
