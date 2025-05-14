import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"


export default function TransactionTable({ transactions }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Transaction</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => (
          <TableRow key={`${transaction.name}-${transaction.date}`}>
            <TableCell className="font-medium">{transaction.name}</TableCell>
            <TableCell>
              {(() => {
                const transactionDate = new Date(transaction.date);
                const today = new Date();
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);

                if (transactionDate.toDateString() === today.toDateString()) {
                  return 'Today';
                } else if (transactionDate.toDateString() === tomorrow.toDateString()) {
                  return 'Tomorrow';
                } else {
                  return `${transactionDate.toLocaleDateString('en-US', { month: 'long' })} ${transactionDate.getDate()}`;
                }
              })()}
            </TableCell>
            <TableCell className={transaction.amount < 0 ? 'text-red-400/80' : 'text-green-400/80'}>
              {transaction.amount < 0 ? '-' : ''}${Math.abs(transaction.amount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={2}>Total</TableCell>
          <TableCell>
            {(() => {
              const total = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
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
