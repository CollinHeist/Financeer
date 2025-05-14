'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { getBankAccounts } from '@/lib/api';
import { IncomeTable } from './IncomeTable';

export default function IncomesByAccount() {
  const { data: accounts, isLoading, error } = useQuery({
    queryKey: ['accounts'],
    queryFn: getBankAccounts
  });

  if (isLoading) {
    return <div className="text-left p-4">Loading accounts...</div>;
  }

  if (error) {
    return <div className="text-left p-4 text-red-500">Error loading accounts: {error.message}</div>;
  }

  if (!accounts || accounts.length === 0) {
    return (
      <div className="text-left p-4">
        <p className="text-gray-500">No accounts found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {accounts.map((account) => (
        <section key={account.id} className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            <a href={`/accounts/${account.id}`} className="hover:underline">
              {account.name}
            </a>
          </h2>
          <Card>
            <CardContent className="pt-6">
              <IncomeTable accountId={account.id} />
            </CardContent>
          </Card>
        </section>
      ))}
    </div>
  );
} 