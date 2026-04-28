import { Transaction } from '../types';
import { DatabaseService } from '../services/databaseService';
import { isFirebase } from '../config';

export interface UseTransactionOperationsReturn {
  toggleConsolidated: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (transaction: Transaction, mode?: 'only' | 'future') => Promise<void>;
}

export function useTransactionOperations(transactions: Transaction[]): UseTransactionOperationsReturn {
  const toggleConsolidated = async (transaction: Transaction) => {
    try {
      const newStatus = !transaction.isConsolidated;
      const operations: any[] = [];

      if (transaction.transferId) {
        const pairedTransactions = transactions.filter((t) => t.transferId === transaction.transferId);

        pairedTransactions.forEach((t) => {
          operations.push({
            type: 'update',
            collection: 'transactions',
            documentId: t.id,
            data: isFirebase() ? { isConsolidated: newStatus } : { is_consolidated: newStatus },
          });

          const diff = t.amount * (newStatus ? 1 : -1);
          const accountDiff = t.type === 'income' ? diff : -diff;

          operations.push({
            type: 'increment',
            collection: 'accounts',
            documentId: t.accountId,
            field: 'balance',
            value: accountDiff,
          });
        });
      } else {
        operations.push({
          type: 'update',
          collection: 'transactions',
          documentId: transaction.id,
          data: isFirebase() ? { isConsolidated: newStatus } : { is_consolidated: newStatus },
        });

        const diff = transaction.amount * (newStatus ? 1 : -1);
        const accountDiff = transaction.type === 'income' ? diff : -diff;

        operations.push({
          type: 'increment',
          collection: 'accounts',
          documentId: transaction.accountId,
          field: 'balance',
          value: accountDiff,
        });
      }

      await DatabaseService.executeBatchWrite(operations);
    } catch (err) {
      console.error('Failed to toggle consolidated status:', err);
      throw err;
    }
  };

  const deleteTransaction = async (transaction: Transaction, mode: 'only' | 'future' = 'only') => {
    try {
      const operations: any[] = [];

      const reverseBalance = (t: Transaction) => {
        if (!t.isConsolidated) return;
        const diff = t.type === 'income' ? -t.amount : t.amount;
        operations.push({
          type: 'increment',
          collection: 'accounts',
          documentId: t.accountId,
          field: 'balance',
          value: diff,
        });
      };

      if (transaction.transferId) {
        const pairedTransactions = transactions.filter((t) => t.transferId === transaction.transferId);

        if (mode === 'only' || !transaction.installmentId) {
          pairedTransactions.forEach((t) => {
            operations.push({
              type: 'delete',
              collection: 'transactions',
              documentId: t.id,
            });
            reverseBalance(t);
          });
        } else {
          pairedTransactions.forEach((paired) => {
            const futurePaired = transactions.filter(
              (t) =>
                t.installmentId === paired.installmentId &&
                (t.installmentNumber || 0) >= (paired.installmentNumber || 0)
            );
            futurePaired.forEach((t) => {
              operations.push({
                type: 'delete',
                collection: 'transactions',
                documentId: t.id,
              });
              reverseBalance(t);
            });
          });
        }
      } else if (mode === 'only' || !transaction.installmentId) {
        operations.push({
          type: 'delete',
          collection: 'transactions',
          documentId: transaction.id,
        });
        reverseBalance(transaction);
      } else {
        const future = transactions.filter(
          (t) =>
            t.installmentId === transaction.installmentId &&
            (t.installmentNumber || 0) >= (transaction.installmentNumber || 0)
        );
        future.forEach((t) => {
          operations.push({
            type: 'delete',
            collection: 'transactions',
            documentId: t.id,
          });
          reverseBalance(t);
        });
      }

      await DatabaseService.executeBatchWrite(operations);
    } catch (err) {
      console.error('Failed to delete transaction:', err);
      throw err;
    }
  };

  return {
    toggleConsolidated,
    deleteTransaction,
  };
}
