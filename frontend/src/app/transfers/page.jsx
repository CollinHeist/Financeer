'use client';

import { useState } from "react";
import { Suspense } from "react";
import { title } from "@/components/primitives";
import TransfersTable from "@/components/transfers-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import TransferDialog from "@/components/TransferDialog";

export default function TransfersPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transfers</h1>
          <p className="text-default-500 mt-2">
            Track and manage all your movements <i>between</i> Accounts. View transfer history, 
            create new transfers, and monitor your account balances in one place.
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Transfer
        </Button>
      </div>
      <div className="space-y-8 mt-6">
        <Suspense fallback={<div>Loading transfers...</div>}>
          <TransfersTable />
        </Suspense>
      </div>
      <TransferDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}
