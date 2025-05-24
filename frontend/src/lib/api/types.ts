interface Frequency {
  value: number;
  unit: "days" | "weeks" | "months" | "years";
}

interface TransactionFilter {
  on: "description" | "note";
  type: "contains" | "regex";
  value: string;
};

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
