'use client';

import { useState } from "react";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Budgets from "@/components/budget/Budgets";
import CreateBudgetDialog from "@/components/budget/CreateBudgetDialog";

export default function BudgetsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
          <p className="text-default-500 mt-2">
            Create and manage budgets to track your spending. Set budget limits, 
            monitor utilization, and stay on top of your financial goals.
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Budget
        </Button>
      </div>
      <div className="space-y-8 mt-6">
        <Suspense fallback={<div>Loading budgets...</div>}>
          <Budgets />
        </Suspense>
      </div>
      <CreateBudgetDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onCreated={() => setIsCreateDialogOpen(false)}
      />
    </div>
  );
}
