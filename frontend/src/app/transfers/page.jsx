'use client';

import { useState } from "react";
import { Suspense } from "react";

import { Card, CardContent } from "@/components/ui/card";

import TransfersTable from "@/components/transfers/table";
import TransferDialog from "@/components/transfers/dialog";


export default function TransfersPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <Card>
      <CardContent className="mt-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Transfers</h1>
            <p className="text-default-500 mt-2">
              Track and manage all your movements <i>between</i> Accounts. View transfer history, 
              create new transfers, and monitor your account balances in one place.
            </p>
          </div>
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
      </CardContent>
    </Card>
  );
}
