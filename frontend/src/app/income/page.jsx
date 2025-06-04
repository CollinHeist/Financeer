'use client';

import { useState } from 'react';

import { Card, CardContent } from "@/components/ui/card";
import IncomeTable from "@/components/income/table";
import IncomeDialog from "@/components/income/dialog";

export default function IncomePage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <Card>
      <CardContent className="mt-6">
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
      </CardContent>
    </Card>
  );
}
