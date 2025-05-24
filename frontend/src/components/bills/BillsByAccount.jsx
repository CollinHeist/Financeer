'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from 'lucide-react';

import BillDialog from '@/components/bills/dialog';
import BillTable from '@/components/bills/table';

import { getAllAccounts } from '@/lib/api/accounts';

export default function BillsByAccount() {
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isNewBillDialogOpen, setIsNewBillDialogOpen] = useState(false);

  const { data: accounts, isLoading, error } = useQuery({
    queryKey: ['accounts'],
    queryFn: getAllAccounts
  });

  const handleAddBillClick = (accountId) => {
    setSelectedAccount(accountId);
    setIsNewBillDialogOpen(true);
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
          </div>
          {/* <Card> */}
            {/* <CardContent className="pt-6"> */}
              <BillTable accountId={account.id} />
            {/* </CardContent> */}
          {/* </Card> */}
        </section>
      ))}

      <BillDialog 
        isOpen={isNewBillDialogOpen} 
        onOpenChange={setIsNewBillDialogOpen} 
        accountId={selectedAccount} 
      />
    </div>
  );
} 