import { CashFlowChart } from "@/components/cashflow-chart";
import { ExpenseBreakdownChart } from "@/components/expense-breakdown-chart";

export default function Home() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="w-full max-w-4xl mt-8 space-y-8">
        <CashFlowChart />
        <ExpenseBreakdownChart />
      </div>
    </section>
  );
} 