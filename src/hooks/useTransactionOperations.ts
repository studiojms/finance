import { writeBatch, doc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { Transaction } from '../types';
import { handleFirestoreError } from '../services/errorService';

export interface UseTransactionOperationsReturn {
  toggleConsolidated: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (transaction: Transaction, mode?: 'only' | 'future') => Promise<void>;
}

export function useTransactionOperations(transactions: Transaction[]): UseTransactionOperationsReturn {
  const toggleConsolidated = async (transaction: Transaction) => {
    if (!db) {
      console.error('Database not initialized');
      return;
    }

    try {
      const batch = writeBatch(db);
      const newStatus = !transaction.isConsolidated;

      if (transaction.transferId) {
        const pairedTransactions = transactions.filter((t) => t.transferId === transaction.transferId);

        pairedTransactions.forEach((t) => {
          const docRef = doc(db, 'transactions', t.id);
          batch.update(docRef, { isConsolidated: newStatus });

          const diff = t.amount * (newStatus ? 1 : -1);
          const accountRef = doc(db, 'accounts', t.accountId);
          const accountDiff = t.type === 'income' ? diff : -diff;
          batch.update(accountRef, { balance: increment(accountDiff) });
        });
      } else {
        const docRef = doc(db, 'transactions', transaction.id);
        batch.update(docRef, { isConsolidated: newStatus });

        const diff = transaction.amount * (newStatus ? 1 : -1);
        const accountRef = doc(db, 'accounts', transaction.accountId);
        const accountDiff = transaction.type === 'income' ? diff : -diff;
        batch.update(accountRef, { balance: increment(accountDiff) });
      }

      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, 'update', `transactions/${transaction.id}`);
    }
  };

  const deleteTransaction = async (transaction: Transaction, mode: 'only' | 'future' = 'only') => {
    if (!db) {
      console.error('Database not initialized');
      return;
    }

    try {
      const batch = writeBatch(db);

      const reverseBalance = (t: Transaction) => {
        if (!t.isConsolidated) return;
        const diff = t.type === 'income' ? -t.amount : t.amount;
        batch.update(doc(db, 'accounts', t.accountId), { balance: increment(diff) });
      };

      if (transaction.transferId) {
        const pairedTransactions = transactions.filter((t) => t.transferId === transaction.transferId);

        if (mode === 'only' || !transaction.installmentId) {
          pairedTransactions.forEach((t) => {
            batch.delete(doc(db, 'transactions', t.id));
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
              batch.delete(doc(db, 'transactions', t.id));
              reverseBalance(t);
            });
          });
        }
      } else if (mode === 'only' || !transaction.installmentId) {
        batch.delete(doc(db, 'transactions', transaction.id));
        reverseBalance(transaction);
      } else {
        const future = transactions.filter(
          (t) =>
            t.installmentId === transaction.installmentId &&
            (t.installmentNumber || 0) >= (transaction.installmentNumber || 0)
        );
        future.forEach((t) => {
          batch.delete(doc(db, 'transactions', t.id));
          reverseBalance(t);
        });
      }

      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, 'delete', 'transactions');
    }
  };

  return {
    toggleConsolidated,
    deleteTransaction,
  };
}
