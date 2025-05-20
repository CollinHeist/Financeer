'use client';

import { useEffect, useState } from 'react';
import { getAllTransfers, deleteTransfer, getTransferTransactions } from '@/lib/api';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconDotsVertical, IconEdit, IconTrash, IconChartLine } from "@tabler/icons-react";
import { formatCurrency, formatDate } from '@/lib/utils';
import { DeleteConfirmation } from "@/components/ui/delete-confirmation";
import AccountOverviewPopover from './AccountOverviewPopover';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import TransactionSummaryDialog from './transaction-summary-dialog';

export default function TransfersTable() {
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [selectedTransferForTransactions, setSelectedTransferForTransactions] = useState(null);

  const { data: transfers, isLoading, error } = useQuery({
    queryKey: ['transfers'],
    queryFn: getAllTransfers
  });

  const { data: transferTransactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['transferTransactions', selectedTransferForTransactions?.id],
    queryFn: () => getTransferTransactions(selectedTransferForTransactions?.id),
    enabled: !!selectedTransferForTransactions?.id,
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
    // TODO: Implement edit functionality
    console.log('Edit transfer:', transfer);
  };

  const handleViewTransactions = (transfer) => {
    setSelectedTransferForTransactions(transfer);
  };

  if (isLoading) {
    return <div>Loading transfers...</div>;
  }

  if (error) {
    return <div>Error loading transfers: {error.message}</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-center">Amount</TableHead>
            <TableHead className="text-center">From Account</TableHead>
            <TableHead className="text-center">To Account</TableHead>
            <TableHead className="text-center">Start Date</TableHead>
            <TableHead className="text-center">End Date</TableHead>
            <TableHead className="text-center"></TableHead>
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
              <TableRow key={transfer.id}>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleViewTransactions(transfer)}
                  >
                    <IconChartLine className="h-4 w-4" />
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
            ))
          )}
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

      <TransactionSummaryDialog
        isOpen={!!selectedTransferForTransactions}
        onOpenChange={(open) => !open && setSelectedTransferForTransactions(null)}
        title={selectedTransferForTransactions?.name || 'Transfer'}
        transactions={transferTransactions}
        isLoading={isLoadingTransactions}
        error={null}
        budgetAmount={selectedTransferForTransactions?.amount}
        frequency={{ unit: 'days', value: 1 }}
        reversedYAxis={false}
      />
    </div>
  );
} 