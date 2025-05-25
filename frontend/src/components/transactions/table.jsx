'use client';

import { useState, useEffect, useRef } from 'react';
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  IconArrowsSplit,
  IconSearch,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconPlus,
  IconFilter,
} from "@tabler/icons-react";
import { cn, formatAmount } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { DeleteConfirmation } from "@/components/ui/delete-confirmation";
import TransactionDialog from '@/components/TransactionDialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import AccountOverviewPopover from '@/components/accounts/overview-popover';
import BillSummaryPopover from '@/components/bills/summary-popover';
import ExpenseSummaryPopover from '@/components/expenses/summary-popover';
import IncomeSummaryPopover from '@/components/income/summary-popover';
import TransferSummaryPopover from '@/components/transfers/summary-popover';

import { getAllAccounts } from '@/lib/api/accounts';
import { getAllExpenses } from '@/lib/api/expenses';
import { getAllTransfers } from '@/lib/api/transfers';
import {
  applyTransactionFilters,
  deleteTransaction,
  patchTransaction,
} from '@/lib/api/transactions';
import { getAllIncomes } from '@/lib/api';
import { getAllAccountBills } from '@/lib/api/bills';
import { SplitDialog } from '@/components/transactions/split-dialog';

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
        <PopoverContent className="w-[450px] max-h-[500px] overflow-y-auto">
          <div className="space-y-2">
            <h4 className="font-medium">Related Transactions</h4>
            <div className="divide-y">
              {transactions.map((t) => (
                <div key={t.id} className="py-2 grid grid-cols-3 gap-2">
                  <span className="text-sm">{formatDate(t.date)}</span>
                  <div>
                    <span className="text-sm truncate block" title={t.description}>{t.description}</span>
                    {t.note && t.note !== t.description && <span className="text-xs text-muted-foreground truncate block" title={t.note}>{t.note}</span>}
                  </div>
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

const QuickCategorizePopover = ({ transaction, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('expense');
  const queryClient = useQueryClient();

  const { data: expenses } = useQuery({
    queryKey: ['expenses', 'all', transaction.date],
    queryFn: () => getAllExpenses(transaction.date),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const { data: incomes } = useQuery({
    queryKey: ['incomes', 'all', transaction.date],
    queryFn: () => getAllIncomes(transaction.date),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const { data: transfers } = useQuery({
    queryKey: ['transfers'],
    queryFn: getAllTransfers,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const { data: bills } = useQuery({
    queryKey: ['bills', transaction.account.id],
    queryFn: () => getAllAccountBills(transaction.account.id),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const handleCategorize = async (item) => {
    try {
      await patchTransaction(transaction.id, {
        expense_id: selectedType === 'expense' ? item.id : null,
        income_id: selectedType === 'income' ? item.id : null,
        transfer_id: selectedType === 'transfer' ? item.id : null,
        bill_id: selectedType === 'bill' ? item.id : null,
        // Clear other IDs when setting a new category
        ...(selectedType === 'transfer' ? {
          expense_id: null,
          income_id: null,
          bill_id: null
        } : {}),
        ...(selectedType === 'expense' ? {
          income_id: null,
          transfer_id: null,
          bill_id: null
        } : {}),
        ...(selectedType === 'income' ? {
          expense_id: null,
          transfer_id: null,
          bill_id: null
        } : {}),
        ...(selectedType === 'bill' ? {
          expense_id: null,
          income_id: null,
          transfer_id: null
        } : {})
      });
      await queryClient.invalidateQueries(['transactions']);
      onClose?.();
    } catch (error) {
      console.error('Failed to categorize transaction:', error);
    }
  };

  const filteredItems = selectedType === 'expense' 
    ? expenses?.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : selectedType === 'income'
    ? incomes?.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : selectedType === 'transfer'
    ? transfers?.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : bills?.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div>
      <Tabs defaultValue="expense" onValueChange={setSelectedType} className="">
        <TabsList className="w-full">
          <TabsTrigger value="bill" className="flex-1">Bills</TabsTrigger>
          <TabsTrigger value="expense" className="flex-1">Expenses</TabsTrigger>
          <TabsTrigger value="income" className="flex-1">Income</TabsTrigger>
          <TabsTrigger value="transfer" className="flex-1">Transfers</TabsTrigger>
        </TabsList>
        <div className="p-4">
          <div className="relative mb-4">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {filteredItems?.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                className="justify-start w-full"
                onClick={() => handleCategorize(item)}
              >
                {selectedType === 'transfer' ? (
                  <div className="flex flex-col items-start">
                    <span>{item.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.from_account.name} → {item.to_account.name}
                    </span>
                  </div>
                ) : selectedType === 'bill' ? (
                  <div className="flex flex-col items-start">
                    <span>{item.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(item.start_date)} {item.end_date ? `- ${formatDate(item.end_date)}` : ''}
                    </span>
                  </div>
                ) : (
                  item.name
                )}
              </Button>
            ))}
            {filteredItems?.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-2">
                No {selectedType === 'expense' ? 'expenses' : selectedType === 'income' ? 'income' : selectedType === 'transfer' ? 'transfers' : 'bills'} found
              </div>
            )}
          </div>
        </div>
      </Tabs>
    </div>
  );
};

const CategoryCell = ({ expense, income, transfer_id, bill, transaction }) => {
  if (!expense && !income && !transfer_id && !bill) {
    return (
      <TableCell className="text-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <IconPlus className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[400px]">
            <QuickCategorizePopover transaction={transaction} />
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    );
  }

  if (income) {
    return (
      <TableCell className="text-center">
        <IncomeSummaryPopover income={income} transaction={transaction} />
      </TableCell>
    );
  }

  if (transfer_id) {
    return (
      <TableCell className="text-center">
        <TransferSummaryPopover transfer_id={transfer_id} transaction={transaction} />
      </TableCell>
    );
  }

  if (bill) {
    return (
      <TableCell className="text-center">
        <BillSummaryPopover bill={bill} transaction={transaction} />
      </TableCell>
    );
  }

  return (
    <TableCell className="text-center">
      <ExpenseSummaryPopover expense={expense} transaction={transaction} />
    </TableCell>
  );
};

const ActionsCell = ({ transaction }) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showSplitDialog, setShowSplitDialog] = useState(false);
  const [isShiftHeld, setIsShiftHeld] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Shift') {
        setIsShiftHeld(true);
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'Shift') {
        setIsShiftHeld(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

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

  const handleDeleteClick = (e) => {
    if (e.shiftKey) {
      // If shift is held, delete immediately without confirmation
      handleDelete();
    } else {
      // Otherwise show confirmation dialog
      setShowDeleteDialog(true);
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
          <DropdownMenuItem onClick={() => setShowSplitDialog(true)}>
            <IconArrowsSplit className="mr-2 h-4 w-4" />
            Split
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={handleDeleteClick}
            className="text-red-600 focus:text-red-600"
          >
            <IconTrash className="mr-2 h-4 w-4" />
            {isShiftHeld ? 'Delete (No Confirmation)' : 'Delete'}
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

      <SplitDialog
        transaction={transaction}
        open={showSplitDialog}
        onOpenChange={setShowSplitDialog}
        onSuccess={() => {
          queryClient.invalidateQueries(['transactions']);
        }}
      />
    </TableCell>
  );
};

export default function TransactionTable({ 
  transactions = [], 
  isLoading = false,
  onSearchChange,
  showUncategorizedOnly,
  onUncategorizedChange,
}) {
  const [filterValue, setFilterValue] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);
  const [showFilterConfirmation, setShowFilterConfirmation] = useState(false);
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const queryClient = useQueryClient();

  // Fetch accounts
  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: getAllAccounts,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Add debounce effect for search with ref to track previous value
  const prevSearchValueRef = useRef(filterValue);
  const prevSelectedAccountsRef = useRef(selectedAccounts);
  const isFirstRender = useRef(true);
  
  useEffect(() => {
    // Skip the first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    // Only set timer if value actually changed
    if (prevSearchValueRef.current !== filterValue || 
        JSON.stringify(prevSelectedAccountsRef.current) !== JSON.stringify(selectedAccounts)) {
      const timer = setTimeout(() => {
        if (onSearchChange) {
          onSearchChange(filterValue, selectedAccounts);
          // Update refs after search is triggered
          prevSearchValueRef.current = filterValue;
          prevSelectedAccountsRef.current = selectedAccounts;
        }
      }, 500); // 500ms debounce
      
      return () => clearTimeout(timer);
    }
  }, [filterValue, selectedAccounts, onSearchChange]);

  // Use transactions directly without sorting
  const sortedTransactions = transactions;

  const columns = [
    { key: 'date', label: 'Date', align: 'right' },
    { key: 'description', label: 'Description', align: 'left' },
    { key: 'account', label: 'Account', align: 'center' },
    { key: 'amount', label: 'Amount', align: 'right' },
    { key: 'category', label: 'Category', align: 'center' },
    { key: 'related', label: 'Related', align: 'center' },
    { key: 'actions', label: '', align: 'center' }
  ];

  const handleApplyFilters = async () => {
    try {
      setIsApplyingFilters(true);
      await applyTransactionFilters();
      // Invalidate and refetch transactions
      await queryClient.invalidateQueries(['transactions']);
    } catch (error) {
      console.error('Failed to apply expense filters:', error);
    } finally {
      setIsApplyingFilters(false);
      setShowFilterConfirmation(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative w-[300px]">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              className="pl-9"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <IconFilter className="h-4 w-4 mr-2" />
                Accounts
                {selectedAccounts.length > 0 && (
                  <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                    {selectedAccounts.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[200px]">
              {accounts.map((account) => (
                <DropdownMenuCheckboxItem
                  key={account.id}
                  checked={selectedAccounts.includes(account.id)}
                  onCheckedChange={(checked) => {
                    setSelectedAccounts(prev => 
                      checked 
                        ? [...prev, account.id]
                        : prev.filter(id => id !== account.id)
                    );
                  }}
                >
                  {account.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="uncategorized" 
              checked={showUncategorizedOnly}
              onCheckedChange={onUncategorizedChange}
            />
            <label
              htmlFor="uncategorized"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Show uncategorized only
            </label>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowFilterConfirmation(true)}
            disabled={isApplyingFilters}
            variant="outline"
          >
            {isApplyingFilters ? 'Applying...' : 'Categorize Expenses'}
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            New Transaction
          </Button>
        </div>
      </div>

      <Dialog open={showFilterConfirmation} onOpenChange={setShowFilterConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Categorize Expenses</DialogTitle>
            <DialogDescription>
              This will automatically associated Transactions with Expenses based on your defined Filters. 
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowFilterConfirmation(false)}
              disabled={isApplyingFilters}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApplyFilters}
              disabled={isApplyingFilters}
            >
              {isApplyingFilters ? 'Applying...' : 'Apply Filters'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={`text-${column.align}`}
                >
                  {column.label}
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
                  <TableCell className="text-right whitespace-nowrap">{formatDate(transaction.date)}</TableCell>
                  <TableCell className="max-w-[750px]">
                    <div className="truncate">{transaction.description}</div>
                    {transaction.note && (
                      <div className="text-sm text-muted-foreground truncate">{transaction.note}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <AccountOverviewPopover account={transaction.account}>
                      <Button
                        variant="link"
                        className="h-auto p-0"
                      >
                        {transaction.account.name}
                      </Button>
                    </AccountOverviewPopover>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatAmount(transaction.amount)}
                  </TableCell>
                  <CategoryCell 
                    bill={transaction.bill}
                    expense={transaction.expense} 
                    income={transaction.income}
                    transfer_id={transaction.transfer_id}
                    transaction={transaction}
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

      <TransactionDialog
        isOpen={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}
