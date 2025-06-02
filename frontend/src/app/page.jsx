import { CashFlowChart } from "@/components/cashflow-chart";
import { ExpenseBreakdownChart } from "@/components/expense-breakdown-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DailyBalance from "@/components/DailyBalance";
import MonthlySnapshot from "@/components/accounts/monthly-snapshot";

export default function Home() {
  return (
    <section className="container mx-auto px-4 py-8 space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Financial Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your financial overview</p>
      </div>

      {/* Quick Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0.00</div>
            <p className="text-xs text-muted-foreground">Across all accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0.00</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0.00</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts Section */}
      <ExpenseBreakdownChart />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <CashFlowChart />
          <DailyBalance accountId={1} />
        </div>
        <div className="space-y-8">
          <MonthlySnapshot />
        </div>
      </div>
    </section>
  );
} 