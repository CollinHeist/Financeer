'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { getAccountSummary } from '@/lib/api';
import { IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useState } from 'react';

/**
 * Formats a number as currency
 * @param {number} number - The number to format
 * @returns {string} The formatted currency string
 */
const formatCurrency = (number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(number);
};

export default function AccountSummary({ accountId, className }) {
  const [timePeriod, setTimePeriod] = useState('this month');
  
  const { data: summary, isLoading, error, refetch } = useQuery({
    queryKey: ['accountSummary', accountId, timePeriod],
    queryFn: () => getAccountSummary(accountId, timePeriod),
    enabled: !!accountId,
  });

  const handlePeriodChange = (e) => {
    setTimePeriod(e.target.value);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Account Summary</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Account Summary</CardTitle>
          <CardDescription className="text-red-500">Error: {error.message}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle>Financial overview for {timePeriod}</CardTitle>
        <CardDescription>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                {(summary?.income || 0) - (summary?.expenses || 0) > 0 ? (
                    <span className="text-green-600">
                      {"Good News! Your balance is up this month"}
                    </span>
                  ) : (summary?.income || 0) - (summary?.expenses || 0) < 0 ? (
                    <span className="text-red-600">
                      {"Uh oh! Your balance is down this month"}
                    </span>
                  ) : null
                }
              </TooltipTrigger>
              <TooltipContent>
                <p>Balance is up this month</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="font-medium">Current Balance</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">{formatCurrency(summary?.balance || 0)}</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="font-medium text-green-600 text-sm">Income</span>
            <span className="text-green-600 font-semibold text-sm">{formatCurrency(summary?.income || 0)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="font-medium text-red-600 text-sm">Expenses</span>
            <span className="text-red-600 font-semibold text-sm">{formatCurrency(summary?.expenses || 0)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
