import { isFirebase } from '../config';
import { TransactionType } from '../types';

export type BatchWriteOperation = {
  type: 'create' | 'update' | 'delete' | 'increment';
  collection: string;
  documentId?: string;
  data?: Record<string, unknown>;
  field?: string;
  value?: number;
};

export interface TransactionWriteData {
  description: string;
  amount: number;
  date: string;
  accountId: string;
  categoryId?: string | null;
  type: TransactionType | string;
  isConsolidated: boolean;
  userId: string;
  installmentId?: string | null;
  installmentNumber?: number | null;
  totalInstallments?: number | null;
  toAccountId?: string | null;
  transferId?: string | null;
  frequency?: string | null;
}

export const TRANSFER_CATEGORY_ID = 'transfer';

export function formatTransactionForDb(data: TransactionWriteData): Record<string, unknown> {
  const categoryId =
    data.categoryId === TRANSFER_CATEGORY_ID && !isFirebase() ? null : (data.categoryId ?? null);

  if (isFirebase()) {
    return {
      description: data.description,
      amount: data.amount,
      date: data.date,
      accountId: data.accountId,
      categoryId: data.categoryId === TRANSFER_CATEGORY_ID ? TRANSFER_CATEGORY_ID : data.categoryId,
      type: data.type,
      isConsolidated: data.isConsolidated,
      userId: data.userId,
      installmentId: data.installmentId ?? null,
      installmentNumber: data.installmentNumber ?? null,
      totalInstallments: data.totalInstallments ?? null,
      toAccountId: data.toAccountId ?? null,
      transferId: data.transferId ?? null,
      frequency: data.frequency ?? null,
    };
  }

  return {
    description: data.description,
    amount: data.amount,
    date: data.date,
    account_id: data.accountId,
    category_id: categoryId,
    type: data.type,
    is_consolidated: data.isConsolidated,
    user_id: data.userId,
    installment_id: data.installmentId ?? null,
    installment_number: data.installmentNumber ?? null,
    total_installments: data.totalInstallments ?? null,
    to_account_id: data.toAccountId ?? null,
    transfer_id: data.transferId ?? null,
    frequency: data.frequency ?? null,
  };
}

export function pushBalanceUpdate(
  operations: BatchWriteOperation[],
  accountId: string,
  type: TransactionType | string,
  amount: number,
  direction: 'add' | 'remove'
) {
  const signed = type === 'income' ? amount : -amount;
  const diff = direction === 'add' ? signed : -signed;

  operations.push({
    type: 'increment',
    collection: 'accounts',
    documentId: accountId,
    field: 'balance',
    value: diff,
  });
}

export function applyBalanceChange(
  operations: BatchWriteOperation[],
  transaction: Pick<TransactionWriteData, 'type' | 'amount' | 'accountId' | 'isConsolidated'>,
  mode: 'add' | 'remove'
) {
  if (!transaction.isConsolidated) return;
  pushBalanceUpdate(operations, transaction.accountId, transaction.type, transaction.amount, mode);
}
