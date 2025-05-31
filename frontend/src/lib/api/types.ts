interface Frequency {
  value: number;
  unit: "days" | "weeks" | "months" | "years";
}

interface Pagination {
  total: number;
  page: number;
  size: number;
  pages: number;
}

interface TransactionFilter {
  on: "description" | "note";
  type: "contains" | "regex";
  value: string;
}

export interface DailyExpenseComparison {
  day_of_month: number;
  historical_average: number;
  current_month: number;
}

export interface NewAccountSchema {
  name: string;
  type: "checking" | "credit" | "investment" | "loan" | "savings";
  account_number?: number | null;
  routing_number?: number | null;
  interest?: number;
  balance: {
    date: string;
    balance: number;
  };
}

export interface NewLinkAccountSchema {
  plaid_account_id: string;
  plaid_item_id: number;
  account_id: number;
}

export interface ReturnAccountSchema {
  id: number;
  name: string;
  type: "checking" | "credit" | "investment" | "loan" | "savings";
  account_number: number | null;
  routing_number: number | null;
  interest: number;
  last_balance: {
    date: string;
    balance: number;
  } | null;
};

export interface ReturnMonthlyAccountSnapshotSchema {
  spent: number;
  budget: number;
  bill_id: number | null;
  bill_name: string | null;
  expense_id: number | null;
  expense_name: string | null;
}

export interface NewBillSchema {
  name: string;
  description: string;
  amount: number;
  type: "one_time" | "recurring";
  frequency: {
    value: number;
    unit: "days" | "weeks" | "months" | "years";
  } | null;
  start_date: string;
  end_date: string | null;
  change_schedule: {
    type: "bonus" | "raise";
    amount: number;
    is_percentage: boolean;
    start_date: string;
    end_date: string | null;
    frequency: number | null;
  }[];
  transaction_filters: Array<Array<TransactionFilter>>;
  account_id: number;
}

export interface PatchBillSchema {
  name?: string;
  description?: string;
  amount?: number;
  type?: "one_time" | "recurring";
  frequency?: {
    value: number;
    unit: "days" | "weeks" | "months" | "years";
  } | null;
  start_date?: string;
  end_date?: string | null;
  change_schedule?: {
    type: "bonus" | "raise";
    amount: number;
    is_percentage: boolean;
    start_date: string;
    end_date: string | null;
    frequency: number | null;
  }[];
  transaction_filters?: Array<Array<{
    on: "description" | "note";
    type: "contains" | "regex";
    value: string;
  }>>;
  account_id?: number;
};

export interface ReturnBillSchema extends NewBillSchema {
  id: number;
};

export interface NewExpenseSchema {
  name: string;
  description: string;
  amount: number;
  is_active: boolean;
  transaction_filters: Array<Array<TransactionFilter>>;
  allow_rollover: boolean;
  max_rollover_amount: number | null;
}

export interface UpdateExpenseSchema {
  name?: string;
  description?: string;
  amount?: number;
  is_active?: boolean;
  transaction_filters?: Array<Array<TransactionFilter>>;
  allow_rollover?: boolean;
  max_rollover_amount?: number;
}

export interface RaiseItem {
  amount: number;
  is_percentage: boolean;
  start_date: string;
  end_date: string | null;
  frequency: Frequency | null;
}

export interface ReturnExpenseSchema {
  id: number;
  name: string;
  description: string;
  amount: number;
  is_active: boolean;
  transaction_filters: Array<Array<TransactionFilter>>;
  allow_rollover: boolean;
  max_rollover_amount: number | null;
}

export interface ReturnIncomeSchema {
  id: number;
  name: string;
  amount: number;
  effective_amount: number;
  frequency: Frequency | null;
  start_date: string;
  end_date: string | null;
  account_id: number;
  account: ReturnAccountSchema;
  raise_schedule: RaiseItem[];
  transaction_filters: TransactionFilter[][];
}

export interface NewTransferSchema {
  name: string;
  description: string;
  amount: number;
  frequency: Frequency | null;
  start_date: string;
  end_date: string | null;
  from_account_id: number;
  to_account_id: number;
  payoff_balance: boolean;
}

export interface PatchTransferSchema {
  name?: string;
  description?: string;
  amount?: number;
  frequency?: Frequency | null;
  start_date?: string;
  end_date?: string | null;
  from_account_id?: number;
  to_account_id?: number;
  payoff_balance?: boolean;
}

export interface ReturnTransferSchema extends NewTransferSchema {
  id: number;
  from_account: ReturnAccountSchema;
  to_account: ReturnAccountSchema;
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
  bill_id: number | null;
  expense_id: number | null;
  income_id: number | null;
  transfer_id: number | null;
  related_transactions: ReturnRelatedTransactionSchema[];
  related_to_transactions: ReturnRelatedTransactionSchema[];
}

export interface ReturnTransactionSchema extends ReturnTransactionSchemaNoAccount {
  account: ReturnAccountSchema;
  bill: ReturnBillSchema | null;
  expense: ReturnExpenseSchema | null;
  income: ReturnIncomeSchema | null;
}

export interface ReturnTransactionSchemaPage extends Pagination {
  items: ReturnTransactionSchema[];
}

export interface NewSplitTransactionSchema {
  amount: number;
  note: string;
}
