import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Account, Transaction, Category } from '../types';
import { handleFirestoreError } from '../services/errorService';
import { DEFAULT_CATEGORIES } from '../constants';
import { ensureCategoriesHaveColors } from '../utils/categoryMigration';

export interface UseFirestoreDataReturn {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
}

export function useFirestoreData(userId: string | null): UseFirestoreDataReturn {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (!userId || !db) return;

    const seedCategories = async () => {
      const q = query(collection(db, 'categories'), where('userId', '==', userId));
      const snap = await getDocs(q);
      if (snap.empty) {
        const batch = writeBatch(db);
        DEFAULT_CATEGORIES.forEach((cat) => {
          const ref = doc(collection(db, 'categories'));
          batch.set(ref, { ...cat, userId });
        });
        await batch.commit();
      } else {
        // Ensure existing categories have colors
        await ensureCategoriesHaveColors(userId);
      }
    };
    seedCategories();

    const qAccounts = query(collection(db, 'accounts'), where('userId', '==', userId));
    const unsubAccounts = onSnapshot(
      qAccounts,
      (snapshot) => {
        setAccounts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Account));
      },
      (err) => handleFirestoreError(err, 'list', 'accounts')
    );

    const qTransactions = query(collection(db, 'transactions'), where('userId', '==', userId));
    const unsubTransactions = onSnapshot(
      qTransactions,
      (snapshot) => {
        setTransactions(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Transaction));
      },
      (err) => handleFirestoreError(err, 'list', 'transactions')
    );

    const qCategories = query(collection(db, 'categories'), where('userId', 'in', [null, userId]));
    const unsubCategories = onSnapshot(
      qCategories,
      (snapshot) => {
        setCategories(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Category));
      },
      (err) => handleFirestoreError(err, 'list', 'categories')
    );

    return () => {
      unsubAccounts();
      unsubTransactions();
      unsubCategories();
    };
  }, [userId]);

  return { accounts, transactions, categories };
}
