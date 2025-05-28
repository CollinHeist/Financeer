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
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DeleteConfirmation } from "@/components/ui/delete-confirmation";
import TransactionDialog from '@/components/TransactionDialog';
import { useQueryClient } from '@tanstack/react-query';

import { dateFromPyDate, getDateKey } from '@/lib/utils';
import { deleteTransaction } from '@/lib/api/transactions';

export default function TransactionSummaryInline({
  title,
  transactions,
  isLoading,
  error,
  budgetAmount,
  frequency,
  reversedYAxis = false,
  isTransfer = false,
}) {
  const [chartType, setChartType] = useState('line');
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

  const aggregateTransactions = (transactions, frequency) => {
    if (!transactions || !frequency) return [];
    
    const groupedData = transactions.reduce((acc, transaction) => {
      // Parse the date in UTC
      const date = new Date(transaction.date + 'T00:00:00Z');
      let key;
      
      // For bar chart, always aggregate by month regardless of frequency
      if (chartType === 'bar') {
        key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
      } else {
        switch (frequency.unit) {
          case 'days':
            key = date.toISOString().split('T')[0];
            break;
          case 'weeks':
            const weekStart = new Date(date);
            weekStart.setUTCDate(date.getUTCDate() - date.getUTCDay());
            const weekNumber = weekStart.getWeek();
            const periodNumber = Math.floor(weekNumber / frequency.value);
            key = new Date(weekStart.getTime() + (periodNumber * frequency.value * 7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
            break;
          case 'months':
            const monthNumber = date.getUTCFullYear() * 12 + date.getUTCMonth();
            const monthPeriod = Math.floor(monthNumber / frequency.value);
            const periodStartMonth = monthPeriod * frequency.value;
            const periodStartYear = Math.floor(periodStartMonth / 12);
            const periodStartMonthInYear = periodStartMonth % 12;
            key = `${periodStartYear}-${String(periodStartMonthInYear + 1).padStart(2, '0')}`;
            break;
          case 'years':
            const yearNumber = date.getUTCFullYear();
            const yearPeriod = Math.floor(yearNumber / frequency.value);
            key = (yearPeriod * frequency.value).toString();
            break;
          default:
            key = date.toISOString().split('T')[0];
        }
      }
      
      if (!acc[key]) {
        acc[key] = {
          date: key,
          transactionAmount: 0,
          budgetAmount: budgetAmount,
          rawDate: new Date(key + 'T00:00:00Z')
        };
      }
      
      acc[key].transactionAmount += transaction.amount;
      return acc;
    }, {});
    
    let result = Object.values(groupedData).sort((a, b) => a.rawDate - b.rawDate);

    // Fill in missing months for bar chart
    if (chartType === 'bar' && result.length > 0) {
      const filledData = [];
      const startDate = new Date(result[0].date + 'T00:00:00Z');
      const endDate = new Date(result[result.length - 1].date + 'T00:00:00Z');

      // Create a map of existing data for quick lookup
      const existingDataMap = new Map(result.map(item => [item.date, item]));

      // Iterate through each month in the range
      let currentDate = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), 1));
      while (currentDate <= endDate) {
        const key = `${currentDate.getUTCFullYear()}-${String(currentDate.getUTCMonth() + 1).padStart(2, '0')}`;
        if (existingDataMap.has(key)) {
          filledData.push(existingDataMap.get(key));
        } else {
          filledData.push({
            date: key,
            transactionAmount: 0,
            budgetAmount: budgetAmount,
            rawDate: new Date(currentDate)
          });
        }

        // Move to next month in UTC
        currentDate = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth() + 1, 1));
      }
      
      result = filledData;
    }
    return result;
  };

  const formatChartData = (transactions) => {
    if (!transactions) return [];

    const aggregatedData = aggregateTransactions(
      isTransfer ? transactions.filter(t => t.amount < 0) : transactions,
      frequency,
    );
    
    const totalAmount = aggregatedData.reduce((sum, item) => sum + item.transactionAmount, 0);
    const averageAmount = totalAmount / aggregatedData.length;
    
    return aggregatedData.map(item => {
      const date = new Date(item.date + 'T00:00:00Z');
      return {
        ...item,
        averageAmount,
        date: date.toLocaleDateString('en-US', { 
          month: 'short',
          ...(chartType === 'line' && { day: 'numeric' }),
          year: '2-digit',
          timeZone: 'UTC',
        })
      };
    });
  };

  const chartConfig = {
    transactionAmount: {
      label: "Total",
      color: "hsl(var(--chart-1))",
    },
    budgetAmount: {
      label: "Budget",
      color: "hsl(var(--chart-2))",
    },
    averageAmount: {
      label: "Average",
      color: "hsl(var(--chart-3))",
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-lg font-semibold text-foreground">{title} Transactions</h4>
        <Tabs value={chartType} onValueChange={setChartType} className="w-[200px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="line">Line</TabsTrigger>
            <TabsTrigger value="bar">Bar</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading && <div className="py-4 text-center text-muted-foreground">Loading Transactions...</div>}

      {error && <div className="py-4 text-center text-destructive">Error loading Transactions: {error.message}</div>}

      {transactions && transactions.length === 0 && (
        <div className="py-4 text-center text-muted-foreground">No Transactions are associated with {title}.</div>
      )}

      {transactions && transactions.length > 0 && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 h-[450px] bg-card rounded-lg p-4 pl-0">
            <ChartContainer config={chartConfig} className="h-full w-full">
              {chartType === 'line' ? (
                <LineChart data={formatChartData(transactions)}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-muted-foreground" />
                  <YAxis reversed={reversedYAxis} className="text-muted-foreground" />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name, item, index) => (
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
                            {index === 1 && (
                              <div className="mt-1.5 flex basis-full items-center border-t border-border pt-1.5 text-xs font-medium text-foreground">
                                Difference
                                <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                                  {formatAmount(item.payload.transactionAmount - item.payload.budgetAmount)}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      />
                    }
                  />
                  <Line
                    type="step"
                    dataKey="transactionAmount"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    dot={false}
                    fill="hsl(var(--chart-1))"
                    fillOpacity={0.3}
                  />
                  <Line
                    type="monotone"
                    dataKey="budgetAmount"
                    stroke="hsl(var(--chart-2))"
                    fill="hsl(var(--chart-2))"
                    fillOpacity={0.3}
                    activeDot={{ r: 8 }}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="averageAmount"
                    stroke="hsl(var(--chart-3))"
                    fill="hsl(var(--chart-3))"
                    fillOpacity={0.3}
                    activeDot={{ r: 8 }}
                    dot={false}
                    strokeDasharray="5 5"
                  />
                </LineChart>
              ) : (
                <BarChart data={formatChartData(transactions)}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-muted-foreground" />
                  <YAxis reversed={reversedYAxis} className="text-muted-foreground" />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name, item, index) => (
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
                            {index === 1 && (
                              <div className="mt-1.5 flex basis-full items-center border-t border-border pt-1.5 text-xs font-medium text-foreground">
                                Difference
                                <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                                  {formatCurrency(item.payload.transactionAmount - item.payload.budgetAmount)}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      />
                    }
                  />
                  <Bar
                    dataKey="transactionAmount"
                    fill="hsl(var(--chart-1))"
                  />
                  <ReferenceLine
                    displayName="Budget"
                    y={budgetAmount}
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                  />
                </BarChart>
              )}
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
                {transactions.map((transaction) => (
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
