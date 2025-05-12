import { Suspense } from "react";
import { title } from "@/components/primitives";
import TransactionList from "@/components/transaction";

export default function TransactionsPage() {
  return (
    <div>
      <h1 className={title()}>Transactions</h1>
      <div className="space-y-8"></div>

      <Suspense fallback={<div>Loading...</div>}>
        <TransactionList />
      </Suspense>
    </div>
  );
}
