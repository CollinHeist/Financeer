'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';
import {
  IconDotsVertical,
  IconEdit,
  IconTrash,
} from "@tabler/icons-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatAmount } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DeleteConfirmation } from "@/components/ui/delete-confirmation";
import TransactionDialog from '@/components/TransactionDialog';
import { useQueryClient } from '@tanstack/react-query';

import { deleteTransaction } from '@/lib/api/transactions';

export default function TransactionSeriesSummary({
  series = [], // Array of { title, transactions, color }
  isLoading = false,
  error = null,
  reversedYAxis = false,
}) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    try {
      await deleteTransaction(selectedTransaction.id);
      // Invalidate and refetch transactions
      await queryClient.invalidateQueries(['transactions']);
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const aggregateTransactions = (transactions) => {
    if (!transactions) return [];
    
    const groupedData = transactions.reduce((acc, transaction) => {
      // Parse the date in UTC
      const date = new Date(transaction.date + 'T00:00:00Z');
      const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[key]) {
        acc[key] = {
          date: key,
          transactionAmount: 0,
          rawDate: new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
        };
      }
      
      acc[key].transactionAmount += transaction.amount;
      return acc;
    }, {});
    
    return Object.values(groupedData).sort((a, b) => a.rawDate - b.rawDate);
  };

  const formatChartData = (series) => {
    if (!series.length) return [];

    // Get all unique months across all series
    const allMonths = new Set();
    series.forEach(s => {
      const aggregated = aggregateTransactions(s.transactions);
      aggregated.forEach(item => allMonths.add(item.date));
    });

    // Create base data structure with all months
    const baseData = Array.from(allMonths).sort().map(date => ({
      date,
      rawDate: new Date(date + '-01T00:00:00Z')
    }));

    // Add data from each series
    return baseData.map(item => {
      const result = { ...item };
      series.forEach(s => {
        const aggregated = aggregateTransactions(s.transactions);
        const monthData = aggregated.find(d => d.date === item.date);
        result[s.title] = monthData ? monthData.transactionAmount : 0;
      });
      return result;
    });
  };

  const chartConfig = series.reduce((acc, s) => ({
    ...acc,
    [s.title]: {
      label: s.title,
      color: s.color || `var(--chart-${Object.keys(acc).length + 1})`,
    }
  }), {});

  return (
    <div className="w-full">
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-foreground">Transaction Series</h4>
      </div>

      {isLoading && <div className="py-4 text-center text-muted-foreground">Loading Transactions...</div>}

      {error && <div className="py-4 text-center text-destructive">Error loading Transactions: {error.message}</div>}

      {series.length === 0 && (
        <div className="py-4 text-center text-muted-foreground">No transaction series to display.</div>
      )}

      {series.length > 0 && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 h-[450px] bg-card rounded-lg p-4 pl-0">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <LineChart data={formatChartData(series)}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-muted-foreground" />
                <YAxis reversed={reversedYAxis} className="text-muted-foreground" />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name, item) => (
                        <>
                          <div
                            className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-[--color-bg]"
                            style={{"--color-bg": `var(--color-${name})`}}
                          />
                          <span className="text-foreground">
                            {chartConfig[name]?.label || name}
                          </span>
                          <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                            <span className="font-normal text-muted-foreground">$</span>
                            {value.toFixed(2)}
                          </div>
                        </>
                      )}
                    />
                  }
                />
                {series.map((s, index) => (
                  <Line
                    key={s.title}
                    type="monotone"
                    dataKey={s.title}
                    stroke={s.color || `var(--chart-${index + 1})`}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 8 }}
                  />
                ))}
              </LineChart>
            </ChartContainer>
          </div>
          
          <div className="h-[450px] overflow-auto bg-card rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-muted-foreground text-sm">Date</TableHead>
                  <TableHead className="text-muted-foreground text-sm">Description</TableHead>
                  <TableHead className="text-right whitespace-nowrap text-muted-foreground text-sm">Amount</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {series.flatMap(s => s.transactions).map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="text-foreground text-xs">
                      {new Date(transaction.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </TableCell>
                    <TableCell className="text-foreground text-xs">
                      <div className="line-clamp-2">{transaction.description || '-'}</div>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap text-xs">
                      {formatAmount(transaction.amount)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <IconDotsVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedTransaction(transaction);
                            setShowEditDialog(true);
                          }}>
                            <IconEdit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedTransaction(transaction);
                              setShowDeleteDialog(true);
                            }}
                            className="text-red-600 focus:text-red-600"
                          >
                            <IconTrash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <DeleteConfirmation
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        title="Delete Transaction"
        itemName={selectedTransaction?.description}
        itemType="Transaction"
      />

      <TransactionDialog
        isOpen={showEditDialog}
        onOpenChange={setShowEditDialog}
        transactionId={selectedTransaction?.id}
      />
    </div>
  );
} 