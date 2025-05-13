import { Suspense } from "react";
import { title } from "@/components/primitives";
import ExpensesByAccount from "@/components/expenses-by-account";

export default function ExpensesPage() {
  return (
    <div>
      <h1 className={title()}>Expenses</h1>
      <div className="space-y-8">
        <Suspense fallback={<div>Loading...</div>}>
          <ExpensesByAccount />
        </Suspense>
      </div>
    </div>
  );
}
