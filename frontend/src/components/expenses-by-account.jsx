'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { getAccounts } from '@/lib/api';
import { ExpenseTable } from './expense-table';
import { Plus } from 'lucide-react';
import ExpenseDialog from './ExpenseDialog';

export default function ExpensesByAccount() {
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isNewExpenseDialogOpen, setIsNewExpenseDialogOpen] = useState(false);

  const { data: accounts, isLoading, error } = useQuery({
    queryKey: ['accounts'],
    queryFn: getAccounts
  });

  const handleAddExpenseClick = (accountId) => {
    setSelectedAccount(accountId);
    setIsNewExpenseDialogOpen(true);
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
              onClick={() => handleAddExpenseClick(account.id)}
              className="p-1 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"
              title="Add new expense"
            >
              <Plus size={16} />
            </button>
          </div>
          <Card>
            <CardContent className="pt-6">
              <ExpenseTable accountId={account.id} />
            </CardContent>
          </Card>
        </section>
      ))}

      <ExpenseDialog 
        isOpen={isNewExpenseDialogOpen} 
        onOpenChange={setIsNewExpenseDialogOpen} 
        accountId={selectedAccount} 
      />
    </div>
  );
} 