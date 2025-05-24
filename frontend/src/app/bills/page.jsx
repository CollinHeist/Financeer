import { Suspense } from "react";

import BillsByAccount from "@/components/bills/BillsByAccount";

export default function BillsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Bills</h1>
      <div className="space-y-8">
        <Suspense fallback={<div>Loading...</div>}>
          <BillsByAccount />
        </Suspense>
      </div>
    </div>
  );
}
