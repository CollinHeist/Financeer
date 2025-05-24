'use client';

import React, { useState } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BarChart2,
  ChevronDown,
  ChevronRight,
  Plus
} from 'lucide-react';
import { IconDotsVertical, IconEdit, IconTrash, IconFilterDollar } from "@tabler/icons-react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { DeleteConfirmation } from "@/components/ui/delete-confirmation";
import AccountOverviewPopover from '@/components/accounts/overview-popover';
import TransactionSummaryInline from '@/components/transactions/summary-inline';
import TransferDialog from '@/components/transfers/dialog';
import TransactionFilterDialog from '@/components/transactions/filter-dialog';

import { formatCurrency, formatDate } from '@/lib/utils';
import {
  deleteTransfer,
  getAllTransfers,
  getTransferTransactions,
} from '@/lib/api/transfers';

export default function TransfersTable() {
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [expandedTransferId, setExpandedTransferId] = useState(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTransferId, setEditingTransferId] = useState(null);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [filteringTransferId, setFilteringTransferId] = useState(null);

  const { data: transfers, isLoading, error } = useQuery({
    queryKey: ['transfers'],
    queryFn: getAllTransfers
  });

  const { data: transferTransactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['transferTransactions', expandedTransferId],
    queryFn: () => getTransferTransactions(expandedTransferId),
    enabled: !!expandedTransferId,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTransfer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      setShowDeleteDialog(false);
      setSelectedTransfer(null);
    }
  });

  const handleDelete = (transfer) => {
    setSelectedTransfer(transfer);
    setShowDeleteDialog(true);
  };

  const handleEdit = (transfer) => {
    setEditingTransferId(transfer.id);
    setIsEditDialogOpen(true);
  };

  const handleViewTransactions = (transfer) => {
    setExpandedTransferId(expandedTransferId === transfer.id ? null : transfer.id);
  };

  const handleFilter = (transfer) => {
    setFilteringTransferId(transfer.id);
    setIsFilterDialogOpen(true);
  };

  if (isLoading) {
    return <div>Loading transfers...</div>;
  }

  if (error) {
    return <div>Error loading transfers: {error.message}</div>;
  }

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center">
              <BarChart2 className="h-4 w-4 mx-auto" />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-center">Amount</TableHead>
            <TableHead className="text-center">From Account</TableHead>
            <TableHead className="text-center">To Account</TableHead>
            <TableHead className="text-center">Start Date</TableHead>
            <TableHead className="text-center">End Date</TableHead>
            <TableHead className="text-center">Filters</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transfers?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center">
                No transfers found
              </TableCell>
            </TableRow>
          ) : (
            transfers?.map((transfer) => (
              <React.Fragment key={transfer.id}>
                <TableRow key={transfer.id}>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleViewTransactions(transfer)}
                    >
                      {expandedTransferId === transfer.id ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <span className="sr-only">Toggle Summary</span>
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium">{transfer.name}</TableCell>
                  <TableCell>{transfer.description || '-'}</TableCell>
                  <TableCell className="text-center">
                    {transfer.payoff_balance ? (
                      <span className="text-muted-foreground">Card Balance</span>
                    ) : (
                      formatCurrency(transfer.amount)
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <AccountOverviewPopover account={transfer.from_account}>
                      <Button
                        variant="link"
                        className="h-auto p-0"
                      >
                        {transfer.from_account.name}
                      </Button>
                    </AccountOverviewPopover>
                  </TableCell>
                  <TableCell className="text-center">
                    <AccountOverviewPopover account={transfer.to_account}>
                      <Button
                        variant="link"
                        className="h-auto p-0"
                      >
                        {transfer.to_account.name}
                      </Button>
                    </AccountOverviewPopover>
                  </TableCell>
                  <TableCell className="text-center">{formatDate(transfer.start_date)}</TableCell>
                  <TableCell className="text-center">{formatDate(transfer.end_date)}</TableCell>
                  <TableCell className="text-center">
                    {transfer.transaction_filters && transfer.transaction_filters.length > 0 ? (
                      <Badge 
                        variant="outline" 
                        className="hover:bg-slate-100 cursor-pointer" 
                        onClick={() => handleFilter(transfer)}
                      >
                        {transfer.transaction_filters.reduce((total, group) => total + group.length, 0)}
                      </Badge>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <IconDotsVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(transfer)}>
                          <IconEdit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleFilter(transfer)}>
                          <IconFilterDollar className="h-4 w-4 mr-2" />
                          Transaction Filters
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(transfer)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <IconTrash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                {expandedTransferId === transfer.id && (
                  <TableRow>
                    <TableCell colSpan={9} className="p-4">
                      <TransactionSummaryInline
                        title={transfer.name}
                        transactions={transferTransactions}
                        isLoading={isLoadingTransactions}
                        error={null}
                        budgetAmount={transfer.amount}
                        frequency={{ unit: 'days', value: 1 }}
                        reversedYAxis={false}
                      />
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))
          )}
          <TableRow className="hover:bg-muted/50">
            <TableCell colSpan={9} className="text-center py-4">
              <Button
                variant="outline"
                className="w-full max-w-[200px]"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Transfer
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <DeleteConfirmation
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={() => deleteMutation.mutate(selectedTransfer?.id)}
        title="Delete Transfer"
        itemName={selectedTransfer?.name}
        itemType="Transfer"
        isDeleting={deleteMutation.isPending}
      />

      <TransferDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      <TransferDialog
        isOpen={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) setEditingTransferId(null);
        }}
        transferId={editingTransferId}
      />

      <TransactionFilterDialog
        isOpen={isFilterDialogOpen}
        onOpenChange={(open) => {
          setIsFilterDialogOpen(open);
          if (!open) setFilteringTransferId(null);
        }}
        transferId={filteringTransferId}
      />
    </div>
  );
} 