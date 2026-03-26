export type AccountType = 'checking' | 'savings' | 'credit_card' | 'cash' | 'investment';
export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  initialBalance: number;
  initialBalanceDate: string; // ISO string
  color: string;
  icon: string;
  userId: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense' | 'both';
  userId?: string | null;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string; // ISO string
  categoryId: string;
  accountId: string;
  type: TransactionType;
  isConsolidated: boolean;
  userId: string;
  installmentId?: string;
  installmentNumber?: number;
  totalInstallments?: number | null;
  toAccountId?: string;
  frequency?: string | null;
  transferId?: string;
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: unknown;
}
