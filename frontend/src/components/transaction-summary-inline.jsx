'use client';

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

export default function TransactionSummaryInline({
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
    <div className="w-full">
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-foreground">{title} Transactions</h4>
      </div>

      {isLoading && <div className="py-4 text-center text-muted-foreground">Loading Transactions...</div>}

      {error && <div className="py-4 text-center text-destructive">Error loading Transactions: {error.message}</div>}

      {transactions && transactions.length === 0 && (
        <div className="py-4 text-center text-muted-foreground">No Transactions are associated with {title}.</div>
      )}

      {transactions && transactions.length > 0 && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 h-[450px] bg-card rounded-lg p-4">
            <ChartContainer config={chartConfig} className="h-full w-full">
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
                                <span className={item.payload.transactionAmount - item.payload.budgetAmount < 0 ? 'text-destructive' : 'text-green-500'}>
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
          
          <div className="h-[450px] overflow-auto bg-card rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-muted-foreground">Date</TableHead>
                  <TableHead className="text-muted-foreground">Description</TableHead>
                  <TableHead className="text-right whitespace-nowrap text-muted-foreground">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="text-foreground">
                      {new Date(transaction.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </TableCell>
                    <TableCell className="text-foreground">
                      <div className="line-clamp-2">{transaction.description || '-'}</div>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <span className={transaction.amount < 0 ? 'text-destructive' : 'text-green-500'}>
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
    </div>
  );
} 
