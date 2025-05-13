import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"


export default function AccountSummary({ data }) {
  return (
    <Card className="@container/card">
      <CardHeader className="relative">
      <CardDescription>{ data.name || "Account" }</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          ${ data.balance || "999.99"}
        </CardTitle>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="line-clamp-1 flex gap-2 font-medium">
          Balance is up this month <IconTrendingUp className="size-4" />
        </div>
        <div className="text-muted-foreground">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-red-400/80">
              Expenses: ${data.expenses || "450.00"}
            </div>
            <div className="flex items-center gap-2 text-green-400/80">
              Income: ${data.income || "1,200.00"}
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
