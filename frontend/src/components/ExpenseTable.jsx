import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"


export default function ExpenseTable({ expenses }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Expense</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {expenses.map((expense) => (
          <TableRow key={expense.id}>
            <TableCell className="font-medium">{expense.name}</TableCell>
            <TableCell className={expense.amount < 0 ? 'text-red-400/80' : 'text-green-400/80'}>
              {expense.amount < 0 ? '-' : ''}${Math.abs(expense.amount).toFixed(2)}
            </TableCell>
            <TableCell>
              {(() => {
                const expenseDate = new Date(expense.start_date);
                const today = new Date();
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                
                if (expenseDate.toDateString() === today.toDateString()) {
                  return 'Today';
                } else if (expenseDate.toDateString() === tomorrow.toDateString()) {
                  return 'Tomorrow';
                } else {
                  return expenseDate.toLocaleDateString('en-US', { weekday: 'long' });
                }
              })()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      {/* <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell className="text-right">$2,500.00</TableCell>
        </TableRow>
      </TableFooter> */}
    </Table>
  )
}
