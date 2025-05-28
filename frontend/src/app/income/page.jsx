'use client';

import { useState } from 'react';

import IncomeTable from "@/components/income/table";
import IncomeDialog from "@/components/income/dialog";

export default function IncomePage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Income</h1>
          <p className="text-muted-foreground">
            Manage your income sources across all accounts. Track recurring payments, raises, and one-time income events.
          </p>
        </div>
      </div>
      <IncomeTable />
      <IncomeDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}
