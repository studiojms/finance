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
      const docRef = doc(db, 'transactions', transaction.id);
      const newStatus = !transaction.isConsolidated;
      batch.update(docRef, { isConsolidated: newStatus });

      const diff = transaction.amount * (newStatus ? 1 : -1);

      if (transaction.type === 'transfer') {
        const fromRef = doc(db, 'accounts', transaction.accountId);
        const toRef = doc(db, 'accounts', transaction.toAccountId!);
        batch.update(fromRef, { balance: increment(-diff) });
        batch.update(toRef, { balance: increment(diff) });
      } else {
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
        if (t.type === 'transfer') {
          batch.update(doc(db, 'accounts', t.accountId), { balance: increment(t.amount) });
          batch.update(doc(db, 'accounts', t.toAccountId!), { balance: increment(-t.amount) });
        } else {
          const diff = t.type === 'income' ? -t.amount : t.amount;
          batch.update(doc(db, 'accounts', t.accountId), { balance: increment(diff) });
        }
      };

      if (mode === 'only' || !transaction.installmentId) {
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
