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
  console.log(expenses);
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Expense</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {expenses.map((expense) => (
          <TableRow key={`${expense.expense_id}-${expense.date}`}>
            <TableCell className="font-medium">{expense.name}</TableCell>
            <TableCell>
              {(() => {
                const expenseDate = new Date(expense.date);
                const today = new Date();
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);

                if (expenseDate.toDateString() === today.toDateString()) {
                  return 'Today';
                } else if (expenseDate.toDateString() === tomorrow.toDateString()) {
                  return 'Tomorrow';
                } else {
                  return expenseDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
                }
              })()}
            </TableCell>
            <TableCell className={expense.amount < 0 ? 'text-red-400/80' : 'text-green-400/80'}>
              {expense.amount < 0 ? '-' : ''}${Math.abs(expense.amount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={2}>Total</TableCell>
          <TableCell>
            {(() => {
              const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
              return (
                <span className={`font-bold ${total < 0 ? 'text-red-400/80' : 'text-green-400/80'}`}>
                  {total < 0 ? '-' : ''}${Math.abs(total).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </span>
              );
            })()}
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}
