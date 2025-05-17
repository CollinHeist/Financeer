
export interface ReturnRelatedTransactionSchema {
  id: number;
  date: string;
  description: string;
  note: string;
  amount: number;
}

export interface ReturnTransactionSchemaNoAccount {
  id: number;
  date: string;
  description: string;
  note: string;
  amount: number;
  account_id: number;
  expense_id: number | null;
  income_id: number | null;
  related_transactions: ReturnRelatedTransactionSchema[];
  related_to_transactions: ReturnRelatedTransactionSchema[];
}
