'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {Card, CardHeader, CardBody} from "@heroui/react";
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { CheckCircle2, Circle, ExternalLink } from "lucide-react";
import { useState } from 'react';
import Link from 'next/link';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

import { formatCurrency } from '@/lib/utils';
import { getAllAccounts } from '@/lib/api/accounts';
import { getDailyBalances } from '@/lib/api/balances';
import { getPlaidAccounts, linkPlaidAccount } from '@/lib/api/plaid';
import { getAllTransactions } from '@/lib/api/transactions';

const chartConfig = {
  balance: {
    label: "Balance",
    color: "hsl(var(--chart-1))",
    gradient: {
      start: "hsl(var(--chart-1))",
      end: "hsl(var(--chart-1))",
      startOpacity: 0.3,
      endOpacity: 0,
    },
  },
};

// This is a Client Component that fetches data using React Query
export default function AccountList() {
  const queryClient = useQueryClient();
  const [openDropdownId, setOpenDropdownId] = useState(null);
  
  const { data: accounts, isLoading, error } = useQuery({
    queryKey: ['accounts'],
    queryFn: getAllAccounts
  });

  const { data: plaidAccounts = [], isLoading: isLoadingPlaidAccounts } = useQuery({
    queryKey: ['plaidAccounts'],
    queryFn: () => getPlaidAccounts(),
    enabled: !!openDropdownId
  });

  const linkAccountMutation = useMutation({
    mutationFn: (accountLink) => linkPlaidAccount(accountLink),
    onSuccess: () => {
      queryClient.invalidateQueries(['accounts']);
      setOpenDropdownId(null);
    }
  });

  const handleLinkAccount = async (accountId, plaidAccountId, plaidItemId) => {
    try {
      await linkAccountMutation.mutateAsync({
        account_id: accountId,
        plaid_account_id: plaidAccountId,
        plaid_item_id: plaidItemId
      });
    } catch (error) {
      console.error('Error linking account:', error);
    }
  };

  if (isLoading) {
    return <div className="text-center p-4">Loading accounts...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">Error loading accounts: {error.message}</div>;
  }

  if (!accounts || accounts.length === 0) {
    return (
      <div className="text-center p-4">
        <p className="text-gray-500">No Accounts found.</p>
        <Link href="/accounts/new" className="mt-4 inline-block text-blue-600 hover:underline">
          Create a new Account
        </Link>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {accounts.map((account) => {
        const isPlaidLinked = account.plaid_item_id != null;
        return (
          <div key={account.id} className="relative">
            <Card className="py-4 hover:shadow-md transition-shadow">
              <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
                <div className="flex justify-between items-center w-full">
                  <p className="text-tiny uppercase font-bold">{account.type}</p>
                  {isPlaidLinked ? (
                    <div className="flex items-center gap-1.5 text-green-500">
                      <CheckCircle2 className="h-4 w-4" />
                      <div className="flex items-center gap-1">
                        <span className="text-xs whitespace-nowrap">Linked</span>
                        {account.plaid_item?.last_refresh && (
                          <>
                            <span className="text-xs text-muted-foreground">-</span>
                            <span className="text-xs text-muted-foreground">
                              Last synced: {new Date(account.plaid_item?.last_refresh).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <DropdownMenu onOpenChange={(open) => {
                      setOpenDropdownId(open ? account.id : null);
                    }}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 flex items-center gap-1.5 text-gray-400 hover:text-gray-600"
                        >
                          <Circle className="h-4 w-4" />
                          <span className="text-xs whitespace-nowrap">Unlinked</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {isLoadingPlaidAccounts ? (
                          <DropdownMenuItem disabled key="loading">
                            Loading Plaid accounts...
                          </DropdownMenuItem>
                        ) : plaidAccounts.length > 0 ? (
                          plaidAccounts.map((plaidAccount) => (
                            <DropdownMenuItem
                              key={plaidAccount.id}
                              onClick={(e) => {
                                e.preventDefault();
                                handleLinkAccount(
                                  account.id,
                                  plaidAccount.id,
                                  plaidAccount.plaid_item_id
                                );
                              }}
                            >
                              {plaidAccount.name} ({plaidAccount.mask})
                            </DropdownMenuItem>
                          ))
                        ) : (
                          <DropdownMenuItem disabled>
                            No Plaid accounts available
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                <div className="flex items-center gap-2 w-full">
                  <h4 className="font-bold text-large">{account.name}</h4>
                  <Link 
                    href={`/accounts/${account.id}`}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              </CardHeader>
              <CardBody className="overflow-visible py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm">Interest Rate: {account.interest}%</p>
                  </div>
                  <div className="h-[100px]">
                    <AccountBalanceChart accountId={account.id} />
                  </div>
                </div>
                <div className="mt-4">
                  <RecentTransactions accountId={account.id} />
                </div>
              </CardBody>
            </Card>
          </div>
        );
      })}
    </div>
  );
}

function AccountBalanceChart({ accountId }) {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 7);

  const { data: balanceData, isLoading } = useQuery({
    queryKey: ['dailyBalances', accountId, startDate.toISOString().split('T')[0], today.toISOString().split('T')[0]],
    queryFn: () => getDailyBalances(
      accountId,
      startDate.toISOString().split('T')[0],
      today.toISOString().split('T')[0]
    ),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading || !balanceData?.length) {
    return <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Loading...</div>;
  }

  const formattedData = balanceData.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    balance: item.balance,
  }));

  return (
    <ChartContainer config={chartConfig}>
      <AreaChart data={formattedData}>
        <defs>
          <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={chartConfig.balance.gradient.start} stopOpacity={chartConfig.balance.gradient.startOpacity}/>
            <stop offset="95%" stopColor={chartConfig.balance.gradient.end} stopOpacity={chartConfig.balance.gradient.endOpacity}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis 
          tickFormatter={formatCurrency}
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          width={60}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => formatCurrency(value)}
            />
          }
        />
        <Area
          type="monotone"
          dataKey="balance"
          stroke={chartConfig.balance.color}
          fill="url(#balanceGradient)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}

function RecentTransactions({ accountId }) {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions', accountId],
    queryFn: () => getAllTransactions(1, 2, null, null, false, [accountId]),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading transactions...</div>;
  }

  if (!transactions?.items?.length) {
    return <div className="text-sm text-muted-foreground">No recent transactions</div>;
  }

  return (
    <div className="space-y-2">
      <h5 className="text-sm font-medium">Recent Transactions</h5>
      <div className="inline-block min-w-[300px] border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-2 text-xs font-medium text-muted-foreground">Date</th>
              <th className="text-left p-2 text-xs font-medium text-muted-foreground">Description</th>
              <th className="text-right p-2 text-xs font-medium text-muted-foreground">Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.items.map((transaction) => (
              <tr key={transaction.id} className="border-b last:border-0">
                <td className="p-2 text-xs text-muted-foreground">
                  {new Date(transaction.date).toLocaleDateString()}
                </td>
                <td className="p-2 text-xs truncate max-w-[150px]">
                  {transaction.description}
                </td>
                <td className={`p-2 text-xs font-medium text-right ${transaction.amount < 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {formatCurrency(transaction.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
