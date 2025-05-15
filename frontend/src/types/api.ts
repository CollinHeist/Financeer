export interface Transaction {
  id: number;
  date: string;
  description: string;
  note: string;
  amount: number;
  account: {
    id: number;
    name: string;
    account_number: number | null;
  };
  expense: {
    id: number;
    name: string;
    description: string;
    frequency: any;
    type: string;
    start_date: string;
    end_date: string | null;
  } | null;
  income: {
    id: number;
    name: string;
    description: string;
    frequency: any;
    start_date: string;
    end_date: string | null;
  } | null;
  related_transactions: Array<{
    id: number;
    date: string;
    description: string;
    amount: number;
  }>;
}

export interface TransactionResponse {
  items: Transaction[];
  total: number;
  page: number;
  size: number;
  pages: number;
} 