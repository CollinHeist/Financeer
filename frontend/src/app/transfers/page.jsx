import { Suspense } from "react";
import { title } from "@/components/primitives";
import TransfersTable from "@/components/transfers-table";

export default function TransfersPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Transfers</h1>
      <p className="text-default-500 mt-2">
        Track and manage all your movements <i>between</i> Accounts. View transfer history, 
        create new transfers, and monitor your account balances in one place.
      </p>
      <div className="space-y-8 mt-6">
        <Suspense fallback={<div>Loading transfers...</div>}>
          <TransfersTable />
        </Suspense>
      </div>
    </div>
  );
}
