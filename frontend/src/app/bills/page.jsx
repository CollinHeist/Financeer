import { Suspense } from "react";

import { Card, CardContent } from "@/components/ui/card";

import BillTable from "@/components/bills/table";

export default function BillsPage() {
  return (
    <Card>
      <CardContent className="mt-6">
        <h1 className="text-3xl font-bold tracking-tight">Bills</h1>
        <div className="space-y-8">
          <BillTable />
        </div>
      </CardContent>
    </Card>
  );
}
