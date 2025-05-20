export interface Frequency {
  value: number;
  unit: 'days' | 'weeks' | 'months' | 'years';
}

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

export interface ReturnDailyBalanceSchema {
  date: string;
  balance: number | null;
}

export interface ReturnTransferSchema {
  id: number;
  name: string;
  description: string;
  amount: number;
  frequency: Frequency | null;
  start_date: string;
  end_date: string | null;
  from_account_id: number;
  from_account: ReturnAccountSchema;
  to_account_id: number;
  to_account: ReturnAccountSchema;
  payoff_balance: boolean;
}

export interface ReturnAccountSchema {
  id: number;
  name: string;
  type: 'checking' | 'credit' | 'investment' | 'loan' | 'savings';
  account_number: number | null;
  routing_number: number | null;
  interest: number;
  last_balance: ReturnBalanceSchema | null;
}

export interface ReturnBalanceSchema {
  id: number;
  account_id: number;
  date: string;
  balance: number;
}
