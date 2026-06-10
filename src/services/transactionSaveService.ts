import { addDays, addWeeks, addMonths, addYears } from 'date-fns';
import { Transaction, TransactionType } from '../types';
import { DatabaseService } from './databaseService';
import {
  applyBalanceChange,
  BatchWriteOperation,
  formatTransactionForDb,
  TRANSFER_CATEGORY_ID,
  TransactionWriteData,
} from '../utils/transactionDbUtils';

export interface SaveTransactionParams {
  description: string;
  amount: number;
  date: string;
  accountId: string;
  categoryId: string;
  toAccountId: string;
  type: TransactionType;
  isConsolidated: boolean;
  userId: string;
  frequency: string;
  installments: string;
  isInfinite: boolean;
  editMode: 'only' | 'future';
  editingTransaction: Transaction | null;
  transactions: Transaction[];
}

function getNextDate(currentDate: Date, freq: string, index: number) {
  switch (freq) {
    case 'daily':
      return addDays(currentDate, index);
    case 'weekly':
      return addWeeks(currentDate, index);
    case 'monthly':
      return addMonths(currentDate, index);
    case 'bimonthly':
      return addMonths(currentDate, index * 2);
    case 'quarterly':
      return addMonths(currentDate, index * 3);
    case 'semiannual':
      return addMonths(currentDate, index * 6);
    case 'annual':
      return addYears(currentDate, index);
    default:
      return addMonths(currentDate, index);
  }
}

function toWriteData(transaction: Transaction): TransactionWriteData {
  return {
    description: transaction.description,
    amount: transaction.amount,
    date: transaction.date,
    accountId: transaction.accountId,
    categoryId: transaction.categoryId,
    type: transaction.type,
    isConsolidated: transaction.isConsolidated,
    userId: transaction.userId,
    installmentId: transaction.installmentId,
    installmentNumber: transaction.installmentNumber,
    totalInstallments: transaction.totalInstallments,
    toAccountId: transaction.toAccountId,
    transferId: transaction.transferId,
    frequency: transaction.frequency,
  };
}

export async function saveTransaction(params: SaveTransactionParams): Promise<void> {
  const {
    description,
    amount: numericAmount,
    date,
    accountId,
    categoryId,
    toAccountId,
    type,
    isConsolidated,
    userId,
    frequency,
    installments,
    isInfinite,
    editMode,
    editingTransaction,
    transactions,
  } = params;

  const baseTransaction: TransactionWriteData = {
    description,
    amount: numericAmount,
    date: new Date(date + 'T12:00:00').toISOString(),
    accountId,
    categoryId: type === 'transfer' ? TRANSFER_CATEGORY_ID : categoryId,
    toAccountId: type === 'transfer' ? toAccountId : null,
    type,
    isConsolidated,
    userId,
    frequency: type === 'transfer' || installments !== '1' ? frequency : null,
  };

  const operations: BatchWriteOperation[] = [];

  const updateBalance = (
    transaction: TransactionWriteData,
    mode: 'add' | 'remove' | 'replace',
    previous?: TransactionWriteData
  ) => {
    if (mode === 'add') {
      applyBalanceChange(operations, transaction, 'add');
      return;
    }

    if (mode === 'remove') {
      applyBalanceChange(operations, transaction, 'remove');
      return;
    }

    if (previous?.isConsolidated) {
      applyBalanceChange(operations, previous, 'remove');
    }
    if (transaction.isConsolidated) {
      applyBalanceChange(operations, transaction, 'add');
    }
  };

  const createTransferPair = (
    desc: string,
    amt: number,
    dt: string,
    fromAcct: string,
    toAcct: string,
    consolidated: boolean,
    instId?: string,
    instNum?: number,
    totalInst?: number | null,
    freq?: string | null
  ) => {
    const transferId = crypto.randomUUID();

    const expenseTransaction: TransactionWriteData = {
      description: desc,
      amount: amt,
      date: dt,
      accountId: fromAcct,
      categoryId: TRANSFER_CATEGORY_ID,
      type: 'expense',
      isConsolidated: consolidated,
      userId,
      transferId,
      installmentId: instId ?? null,
      installmentNumber: instNum ?? null,
      totalInstallments: totalInst ?? null,
      frequency: freq ?? null,
    };

    operations.push({
      type: 'create',
      collection: 'transactions',
      documentId: crypto.randomUUID(),
      data: formatTransactionForDb(expenseTransaction),
    });
    updateBalance(expenseTransaction, 'add');

    const incomeTransaction: TransactionWriteData = {
      description: desc,
      amount: amt,
      date: dt,
      accountId: toAcct,
      categoryId: TRANSFER_CATEGORY_ID,
      type: 'income',
      isConsolidated: consolidated,
      userId,
      transferId,
      installmentId: instId ?? null,
      installmentNumber: instNum ?? null,
      totalInstallments: totalInst ?? null,
      frequency: freq ?? null,
    };

    operations.push({
      type: 'create',
      collection: 'transactions',
      documentId: crypto.randomUUID(),
      data: formatTransactionForDb(incomeTransaction),
    });
    updateBalance(incomeTransaction, 'add');
  };

  if (editingTransaction) {
    if (editingTransaction.transferId) {
      const pairedTransactions = transactions.filter((t) => t.transferId === editingTransaction.transferId);

      if (editMode === 'future' && editingTransaction.installmentId) {
        const futurePairedTransactions = pairedTransactions.filter(
          (t) => (t.installmentNumber || 0) >= (editingTransaction.installmentNumber || 0)
        );

        futurePairedTransactions.forEach((pairedTransaction) => {
          const indexDiff = (pairedTransaction.installmentNumber || 1) - (editingTransaction.installmentNumber || 1);
          const newDate = getNextDate(new Date(date), frequency, indexDiff);

          const descriptionWithSuffix =
            pairedTransaction.totalInstallments === null
              ? `${description} (#${pairedTransaction.installmentNumber})`
              : pairedTransaction.totalInstallments
                ? `${description} (${pairedTransaction.installmentNumber}/${pairedTransaction.totalInstallments})`
                : description;

          const previousTransaction = toWriteData(pairedTransaction);
          const updatedTransaction: TransactionWriteData = {
            description: descriptionWithSuffix,
            amount: numericAmount,
            date: newDate.toISOString(),
            accountId: pairedTransaction.type === 'expense' ? accountId : toAccountId,
            categoryId: TRANSFER_CATEGORY_ID,
            type: pairedTransaction.type,
            isConsolidated: pairedTransaction.isConsolidated,
            userId,
            transferId: pairedTransaction.transferId,
            installmentId: pairedTransaction.installmentId,
            installmentNumber: pairedTransaction.installmentNumber,
            totalInstallments: pairedTransaction.totalInstallments,
            frequency,
          };

          operations.push({
            type: 'update',
            collection: 'transactions',
            documentId: pairedTransaction.id,
            data: formatTransactionForDb(updatedTransaction),
          });
          updateBalance(updatedTransaction, 'replace', previousTransaction);
        });
      } else {
        pairedTransactions.forEach((pairedTransaction) => {
          const previousTransaction = toWriteData(pairedTransaction);
          const updatedTransaction: TransactionWriteData = {
            description,
            amount: numericAmount,
            date: new Date(date + 'T12:00:00').toISOString(),
            accountId: pairedTransaction.type === 'expense' ? accountId : toAccountId,
            categoryId: TRANSFER_CATEGORY_ID,
            type: pairedTransaction.type,
            isConsolidated: pairedTransaction.isConsolidated,
            userId,
            transferId: pairedTransaction.transferId,
            toAccountId: pairedTransaction.type === 'expense' ? toAccountId : accountId,
            installmentId: pairedTransaction.installmentId,
            installmentNumber: pairedTransaction.installmentNumber,
            totalInstallments: pairedTransaction.totalInstallments,
            frequency: pairedTransaction.frequency,
          };

          operations.push({
            type: 'update',
            collection: 'transactions',
            documentId: pairedTransaction.id,
            data: formatTransactionForDb(updatedTransaction),
          });
          updateBalance(updatedTransaction, 'replace', previousTransaction);
        });
      }
    } else if (editMode === 'future' && editingTransaction.installmentId) {
      const futureTransactions = transactions.filter(
        (t) =>
          t.installmentId === editingTransaction.installmentId &&
          (t.installmentNumber || 0) >= (editingTransaction.installmentNumber || 0)
      );

      futureTransactions.forEach((futureTransaction) => {
        const indexDiff = (futureTransaction.installmentNumber || 1) - (editingTransaction.installmentNumber || 1);
        const newDate = getNextDate(new Date(date), frequency, indexDiff);

        const descriptionWithSuffix =
          futureTransaction.totalInstallments === null
            ? `${description} (#${futureTransaction.installmentNumber})`
            : futureTransaction.totalInstallments
              ? `${description} (${futureTransaction.installmentNumber}/${futureTransaction.totalInstallments})`
              : description;

        const previousTransaction = toWriteData(futureTransaction);
        const updatedTransaction: TransactionWriteData = {
          ...baseTransaction,
          description: descriptionWithSuffix,
          date: newDate.toISOString(),
          installmentNumber: futureTransaction.installmentNumber,
          totalInstallments: futureTransaction.totalInstallments,
          installmentId: futureTransaction.installmentId,
        };

        operations.push({
          type: 'update',
          collection: 'transactions',
          documentId: futureTransaction.id,
          data: formatTransactionForDb(updatedTransaction),
        });
        updateBalance(updatedTransaction, 'replace', previousTransaction);
      });
    } else {
      const previousTransaction = toWriteData(editingTransaction);

      operations.push({
        type: 'update',
        collection: 'transactions',
        documentId: editingTransaction.id,
        data: formatTransactionForDb(baseTransaction),
      });
      updateBalance(baseTransaction, 'replace', previousTransaction);
    }
  } else {
    const numInstallments = isInfinite ? 24 : parseInt(installments);

    if (type === 'transfer') {
      if (numInstallments > 1 || isInfinite) {
        const installmentId = crypto.randomUUID();
        for (let i = 0; i < numInstallments; i++) {
          const installmentDate = getNextDate(new Date(date), frequency, i);
          const descriptionWithSuffix = isInfinite
            ? `${description} (#${i + 1})`
            : `${description} (${i + 1}/${numInstallments})`;

          createTransferPair(
            descriptionWithSuffix,
            numericAmount,
            installmentDate.toISOString(),
            accountId,
            toAccountId,
            i === 0 ? isConsolidated : false,
            installmentId,
            i + 1,
            isInfinite ? null : numInstallments,
            frequency
          );
        }
      } else {
        createTransferPair(
          description,
          numericAmount,
          new Date(date + 'T12:00:00').toISOString(),
          accountId,
          toAccountId,
          isConsolidated,
          undefined,
          undefined,
          undefined,
          null
        );
      }
    } else if (numInstallments > 1 || isInfinite) {
      const installmentId = crypto.randomUUID();
      for (let i = 0; i < numInstallments; i++) {
        const installmentDate = getNextDate(new Date(date), frequency, i);
        const descriptionWithSuffix = isInfinite
          ? `${description} (#${i + 1})`
          : `${description} (${i + 1}/${numInstallments})`;
        const newTransaction: TransactionWriteData = {
          ...baseTransaction,
          description: descriptionWithSuffix,
          date: installmentDate.toISOString(),
          installmentId,
          installmentNumber: i + 1,
          totalInstallments: isInfinite ? null : numInstallments,
          isConsolidated: i === 0 ? isConsolidated : false,
        };

        operations.push({
          type: 'create',
          collection: 'transactions',
          documentId: crypto.randomUUID(),
          data: formatTransactionForDb(newTransaction),
        });
        updateBalance(newTransaction, 'add');
      }
    } else {
      operations.push({
        type: 'create',
        collection: 'transactions',
        documentId: crypto.randomUUID(),
        data: formatTransactionForDb(baseTransaction),
      });
      updateBalance(baseTransaction, 'add');
    }
  }

  await DatabaseService.executeBatchWrite(operations);
}
