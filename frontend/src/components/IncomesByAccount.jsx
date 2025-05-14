'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { getBankAccounts } from '@/lib/api';
import { IncomeTable } from './IncomeTable';
import { Plus } from 'lucide-react';
import NewIncomeDialog from './NewIncomeDialog';

export default function IncomesByAccount() {
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isNewIncomeDialogOpen, setIsNewIncomeDialogOpen] = useState(false);

  const { data: accounts, isLoading, error } = useQuery({
    queryKey: ['accounts'],
    queryFn: getBankAccounts
  });

  const handleAddIncomeClick = (accountId) => {
    setSelectedAccount(accountId);
    setIsNewIncomeDialogOpen(true);
  };

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
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              <a href={`/accounts/${account.id}`} className="hover:underline">
                {account.name}
              </a>
            </h2>
            <button 
              onClick={() => handleAddIncomeClick(account.id)}
              className="p-1 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"
              title="Add new income"
            >
              <Plus size={16} />
            </button>
          </div>
          <Card>
            <CardContent className="pt-6">
              <IncomeTable accountId={account.id} />
            </CardContent>
          </Card>
        </section>
      ))}

      <NewIncomeDialog 
        isOpen={isNewIncomeDialogOpen} 
        onOpenChange={setIsNewIncomeDialogOpen} 
        accountId={selectedAccount} 
      />
    </div>
  );
} 