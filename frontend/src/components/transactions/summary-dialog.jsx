'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Line, LineChart, XAxis, YAxis, CartesianGrid } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export default function TransactionSummaryDialog({
  isOpen,
  onOpenChange,
  title,
  transactions,
  isLoading,
  error,
  budgetAmount,
  frequency,
  reversedYAxis = false,
}) {
  const aggregateTransactions = (transactions, frequency) => {
    if (!transactions || !frequency) return [];
    
    const groupedData = transactions.reduce((acc, transaction) => {
      const date = new Date(transaction.date);
      let key;
      
      switch (frequency.unit) {
        case 'days':
          key = date.toISOString().split('T')[0];
          break;
        case 'weeks':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          const weekNumber = Math.floor(date.getTime() / (7 * 24 * 60 * 60 * 1000));
          const periodNumber = Math.floor(weekNumber / frequency.value);
          key = new Date(weekStart.getTime() + (periodNumber * frequency.value * 7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
          break;
        case 'months':
          const monthNumber = date.getFullYear() * 12 + date.getMonth();
          const monthPeriod = Math.floor(monthNumber / frequency.value);
          const periodStartMonth = monthPeriod * frequency.value;
          const periodStartYear = Math.floor(periodStartMonth / 12);
          const periodStartMonthInYear = periodStartMonth % 12;
          key = `${periodStartYear}-${String(periodStartMonthInYear + 1).padStart(2, '0')}`;
          break;
        case 'years':
          const yearNumber = date.getFullYear();
          const yearPeriod = Math.floor(yearNumber / frequency.value);
          key = (yearPeriod * frequency.value).toString();
          break;
        default:
          key = date.toISOString().split('T')[0];
      }
      
      if (!acc[key]) {
        acc[key] = {
          date: key,
          transactionAmount: 0,
          budgetAmount: budgetAmount,
          rawDate: new Date(key)
        };
      }
      
      acc[key].transactionAmount += transaction.amount;
      return acc;
    }, {});
        
    return Object.values(groupedData).sort((a, b) => a.rawDate - b.rawDate);
  };

  const formatChartData = (transactions) => {
    if (!transactions) return [];
    
    const aggregatedData = aggregateTransactions(transactions, frequency);
    
    const totalAmount = aggregatedData.reduce((sum, item) => sum + item.transactionAmount, 0);
    const averageAmount = totalAmount / aggregatedData.length;
    
    return aggregatedData.map(item => ({
      ...item,
      averageAmount,
      date: new Date(item.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        ...(frequency?.unit === 'year' && { year: 'numeric' })
      })
    }));
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
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px]">
        <DialogHeader>
          <DialogTitle>{title} Transactions</DialogTitle>
        </DialogHeader>

        {isLoading && <div className="py-4 text-center">Loading Transactions...</div>}

        {error && <div className="py-4 text-center text-red-500">Error loading Transactions: {error.message}</div>}

        {transactions && transactions.length === 0 && (
          <div className="py-4 text-center text-gray-500">No Transactions are associated with {title}.</div>
        )}

        {transactions && transactions.length > 0 && (
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 min-h-[400px]">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <LineChart data={formatChartData(transactions)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis reversed={reversedYAxis} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name, item, index) => (
                          <>
                            <div
                              className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-[--color-bg]"
                              style={{"--color-bg": `var(--color-${name})`}}
                            />
                            {chartConfig[name]?.label ||
                              name}
                            <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                              <span className="font-normal text-muted-foreground">$</span>
                              {value.toFixed(2)}
                            </div>
                            {index === 1 && (
                              <div className="mt-1.5 flex basis-full items-center border-t pt-1.5 text-xs font-medium text-foreground">
                                Difference
                                <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                                  <span className={item.payload.transactionAmount - item.payload.budgetAmount < 0 ? 'text-red-500' : 'text-green-500'}>
                                    <span className="font-normal">
                                      {(item.payload.transactionAmount - item.payload.budgetAmount < 0 ? '-' : '+')}
                                      $
                                    </span>
                                    {Math.abs(item.payload.transactionAmount - item.payload.budgetAmount).toFixed(2)}
                                  </span>
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
                    fill="hsl(var(--chart-1))"
                    fillOpacity={0.3}
                    activeDot={{ r: 8 }}
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
              </ChartContainer>
            </div>
            
            <div className="max-h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {new Date(transaction.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="line-clamp-2">{transaction.description || '-'}</div>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <span className={transaction.amount < 0 ? 'text-red-500' : 'text-green-500'}>
                          {transaction.amount < 0 ? '-' : ''}
                          ${Math.abs(transaction.amount).toLocaleString('en-US', { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 