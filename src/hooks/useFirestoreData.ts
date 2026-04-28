import { useState, useEffect } from 'react';
import { Account, Transaction, Category } from '../types';
import { DatabaseService } from '../services/databaseService';
import { DEFAULT_CATEGORIES } from '../constants';
import { isFirebase, isSupabase } from '../config';

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
    if (!userId) return;

    const seedCategories = async () => {
      try {
        const allCategories = await DatabaseService.queryDocuments('categories', []);

        if (allCategories.length === 0) {
          for (const cat of DEFAULT_CATEGORIES) {
            const categoryData = isFirebase()
              ? { ...cat, userId: null }
              : {
                  name: cat.name,
                  icon: cat.icon,
                  color: cat.color,
                  type: cat.type,
                  user_id: null,
                };
            await DatabaseService.addDocument('categories', categoryData);
          }
        }
      } catch (error) {
        console.error('Failed to seed categories:', error);
      }
    };
    seedCategories();

    const unsubAccounts = DatabaseService.subscribeToCollection('accounts', userId, [], (data) => {
      setAccounts(
        data.map((d) => ({
          id: d.id,
          name: d.name,
          type: d.type,
          balance: d.balance,
          color: d.color,
          userId: isFirebase() ? d.userId : d.user_id,
        })) as Account[]
      );
    });

    const unsubTransactions = DatabaseService.subscribeToCollection('transactions', userId, [], (data) => {
      setTransactions(
        data.map((d) => ({
          id: d.id,
          description: d.description,
          amount: d.amount,
          date: d.date,
          categoryId: isFirebase() ? d.categoryId : d.category_id,
          accountId: isFirebase() ? d.accountId : d.account_id,
          type: d.type,
          isConsolidated: isFirebase() ? d.isConsolidated : d.is_consolidated,
          userId: isFirebase() ? d.userId : d.user_id,
          installmentId: isFirebase() ? d.installmentId : d.installment_id,
          installmentNumber: isFirebase() ? d.installmentNumber : d.installment_number,
          totalInstallments: isFirebase() ? d.totalInstallments : d.total_installments,
          toAccountId: isFirebase() ? d.toAccountId : d.to_account_id,
        })) as Transaction[]
      );
    });

    const unsubCategories = DatabaseService.subscribeToCollection('categories', userId, [], (data) => {
      setCategories(
        data.map((d) => ({
          id: d.id,
          name: d.name,
          icon: d.icon,
          color: d.color,
          type: d.type,
          userId: isFirebase() ? d.userId : d.user_id,
        })) as Category[]
      );
    });

    return () => {
      unsubAccounts();
      unsubTransactions();
      unsubCategories();
    };
  }, [userId]);

  return { accounts, transactions, categories };
}
