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

import BillDialog from '@/components/bills/dialog';
import TransactionFilterDialog from '@/components/transactions/filter-dialog';
import BillTransactionSummary from '@/components/bills/BillTransactionSummary';

import { getAllAccountBills } from '@/lib/api/bills';
import { deleteBill } from '@/lib/api/bills';


export default function BillTable({ accountId }) {
  const queryClient = useQueryClient();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [billToDelete, setBillToDelete] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [billToEdit, setBillToEdit] = useState(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [billToFilter, setBillToFilter] = useState(null);
  const [expandedBillId, setExpandedBillId] = useState(null);
  const [newBillDialogOpen, setNewBillDialogOpen] = useState(false);

  const { data: bills, isLoading, error } = useQuery({
    queryKey: ['bills', accountId],
    queryFn: () => getAllAccountBills(accountId)
  });

  const deleteBillMutation = useMutation({
    mutationFn: (billId) => deleteBill(billId),
    onSuccess: () => {
      queryClient.invalidateQueries(['bills', accountId]);
      setDeleteConfirmOpen(false);
      setBillToDelete(null);
    },
    onError: (error) => {
      console.error('Error deleting bill:', error);
    }
  });

  const handleDelete = (bill) => {
    setBillToDelete(bill);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (billToDelete) {
      deleteBillMutation.mutate(billToDelete.id);
    }
  };

  const handleEdit = (bill) => {
    setBillToEdit(bill);
    setEditDialogOpen(true);
  };

  const handleEditDialogClose = (open) => {
    setEditDialogOpen(open);
    if (!open) {
      setBillToEdit(null);
    }
  };

  const handleFilter = (bill) => {
    setBillToFilter(bill);
    setFilterDialogOpen(true);
  };
  
  const handleFilterDialogClose = (open) => {
    setFilterDialogOpen(open);
    if (!open) {
      setBillToFilter(null);
    }
  };

  const handleSummary = (bill) => {
    setExpandedBillId(expandedBillId === bill.id ? null : bill.id);
  };

  if (error) {
    return <div className="text-left p-4 text-red-500">Error loading Bills: {error.message}</div>;
  }

  if (!bills || bills.length === 0) {
    return (
      <div className="text-left p-4">
        <p className="text-gray-500">No Bills found for this Account.</p>
      </div>
    );
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
            <TableHead className="text-left">Date</TableHead>
            <TableHead className="text-left">End Date</TableHead>
            <TableHead className="text-left">Filters</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bills.map((bill) => (
            <React.Fragment key={bill.id}>
              <TableRow>
                <TableCell className="text-center">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => handleSummary(bill)}
                  >
                    {expandedBillId === bill.id ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <span className="sr-only">Toggle Summary</span>
                  </Button>
                </TableCell>
                <TableCell className="font-medium text-left">
                  {bill.name}
                </TableCell>
                <TableCell className="text-left">{bill.description || '-'}</TableCell>
                <TableCell className={`text-left ${bill.amount < 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {bill.amount < 0 ? '-' : ''}${Math.abs(bill.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-left">
                  {bill.start_date ? (
                    bill.type === 'one_time' ? (
                      `On ${new Date(bill.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                    ) : (
                      `Every ${bill.frequency.value} ${bill.frequency.unit} starting ${new Date(bill.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                    )
                  ) : '-'}
                </TableCell>
                <TableCell className="text-left">
                  {bill.end_date ? new Date(bill.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 
                    bill.type === 'one_time' ? '-' : <span className="text-gray-400">Never</span>}
                </TableCell>
                <TableCell className="text-left">
                  {bill.transaction_filters && bill.transaction_filters.length > 0 ? (
                    <Badge 
                      variant="outline" 
                      className="hover:bg-slate-100 cursor-pointer" 
                      onClick={() => handleFilter(bill)}
                    >
                      {bill.transaction_filters.reduce((total, group) => total + group.length, 0)}
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
                      <DropdownMenuItem onClick={() => handleEdit(bill)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleFilter(bill)}>
                        <IconFilterDollar className="mr-2 h-4 w-4" />
                        Transaction Filters
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSummary(bill)}>
                        <BarChart2 className="mr-2 h-4 w-4" />
                        {expandedBillId === bill.id ? 'Hide Summary' : 'Show Summary'}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(bill)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              {expandedBillId === bill.id && (
                <TableRow>
                  <TableCell colSpan={8} className="p-4">
                    <BillTransactionSummary
                      isInline={true}
                      billId={bill.id}
                      billName={bill.name}
                      billAmount={bill.amount}
                      billFrequency={bill.frequency}
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
                onClick={() => setNewBillDialogOpen(true)}
              >
                + Add New Bill
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <DeleteConfirmation
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Bill"
        itemName={billToDelete?.name}
        itemType="bill"
        onConfirm={confirmDelete}
        isDeleting={deleteBillMutation.isLoading}
      />

      <BillDialog
        isOpen={editDialogOpen}
        onOpenChange={handleEditDialogClose}
        accountId={accountId}
        billId={billToEdit?.id}
      />

      <BillDialog
        isOpen={newBillDialogOpen}
        onOpenChange={setNewBillDialogOpen}
        accountId={accountId}
      />

      <TransactionFilterDialog
        isOpen={filterDialogOpen}
        onOpenChange={handleFilterDialogClose}
        billId={billToFilter?.id}
      />
    </div>
  );
}
