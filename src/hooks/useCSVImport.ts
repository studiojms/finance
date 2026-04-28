import { useState } from 'react';
import { DatabaseService } from '../services/databaseService';
import { CSVService } from '../services/csvService';
import { Account, Category } from '../types';
import { format } from 'date-fns';
import { isFirebase } from '../config';

export interface UseCSVImportReturn {
  isImporting: boolean;
  importProgress: number;
  importStatus: 'idle' | 'processing' | 'success' | 'error';
  importError: string;
  importFromCSV: (file: File) => Promise<void>;
}

export function useCSVImport(userId: string, accounts: Account[], categories: Category[]): UseCSVImportReturn {
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [importError, setImportError] = useState('');

  const importFromCSV = async (file: File) => {
    try {
      const text = await CSVService.readCSVFile(file);
      const rows = CSVService.parseCSVContent(text);

      if (rows.length === 0) {
        setImportError('No valid data found in CSV file');
        setImportStatus('error');
        return;
      }

      const tempAccounts: Record<string, string> = {};
      const tempCategories: Record<string, string> = {};

      setIsImporting(true);
      setImportProgress(0);
      setImportStatus('processing');
      setImportError('');

      let skippedCount = 0;

      const CHUNK_SIZE = 100;
      const totalChunks = Math.ceil(rows.length / CHUNK_SIZE);

      for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
        const chunk = rows.slice(i, i + CHUNK_SIZE);
        const operations: any[] = [];
        const accountBalanceChanges: Record<string, number> = {};

        for (const row of chunk) {
          const dateObj = CSVService.parseDate(row.date);
          if (!dateObj) {
            skippedCount++;
            continue;
          }
          const date = dateObj.toISOString();

          const parsedAmount = CSVService.parseAmount(row.amount);
          if (parsedAmount === null) {
            skippedCount++;
            continue;
          }

          const type = parsedAmount >= 0 ? 'income' : 'expense';
          const absAmount = Math.abs(parsedAmount);

          let accountId =
            accounts.find((a) => a.name.toLowerCase() === row.account.toLowerCase())?.id ||
            tempAccounts[row.account.toLowerCase()];
          if (!accountId) {
            accountId = `temp_acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            tempAccounts[row.account.toLowerCase()] = accountId;

            const accountData = isFirebase()
              ? {
                  name: row.account,
                  type: 'checking',
                  balance: 0,
                  initialBalance: 0,
                  initialBalanceDate: format(new Date(), 'yyyy-MM-dd'),
                  color: '#94a3b8',
                  userId,
                }
              : {
                  name: row.account,
                  type: 'checking',
                  balance: 0,
                  initial_balance: 0,
                  initial_balance_date: format(new Date(), 'yyyy-MM-dd'),
                  color: '#94a3b8',
                  user_id: userId,
                };

            operations.push({
              type: 'create',
              collection: 'accounts',
              documentId: accountId,
              data: accountData,
            });
          }

          let categoryId =
            categories.find(
              (c) => c.name.toLowerCase() === row.category.toLowerCase() && (c.type === type || c.type === 'both')
            )?.id || tempCategories[row.category.toLowerCase() + type];
          if (!categoryId) {
            categoryId = `temp_cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            tempCategories[row.category.toLowerCase() + type] = categoryId;

            const categoryData = isFirebase()
              ? {
                  name: row.category,
                  icon: 'Plus',
                  color: '#94a3b8',
                  type: type,
                  userId,
                }
              : {
                  name: row.category,
                  icon: 'Plus',
                  color: '#94a3b8',
                  type: type,
                  user_id: userId,
                };

            operations.push({
              type: 'create',
              collection: 'categories',
              documentId: categoryId,
              data: categoryData,
            });
          }

          const transactionId = `temp_txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const transactionData = isFirebase()
            ? {
                description: row.description,
                amount: absAmount,
                date,
                accountId,
                categoryId,
                type,
                isConsolidated: dateObj <= new Date(),
                userId,
              }
            : {
                description: row.description,
                amount: absAmount,
                date,
                account_id: accountId,
                category_id: categoryId,
                type,
                is_consolidated: dateObj <= new Date(),
                user_id: userId,
              };

          operations.push({
            type: 'create',
            collection: 'transactions',
            documentId: transactionId,
            data: transactionData,
          });

          accountBalanceChanges[accountId] = (accountBalanceChanges[accountId] || 0) + parsedAmount;
        }

        for (const accId in accountBalanceChanges) {
          operations.push({
            type: 'increment',
            collection: 'accounts',
            documentId: accId,
            field: 'balance',
            value: accountBalanceChanges[accId],
          });
        }

        if (operations.length > 0) {
          try {
            await DatabaseService.executeBatchWrite(operations);
            const currentChunk = Math.floor(i / CHUNK_SIZE) + 1;
            setImportProgress(Math.round((currentChunk / totalChunks) * 100));
          } catch (err: unknown) {
            setImportStatus('error');
            setImportError((err as Error).message || 'Error processing batch.');
            setIsImporting(false);
            console.error('Import error:', err);
            return;
          }
        }
      }

      if (skippedCount > 0) {
        setImportStatus('error');
        setImportError(`Import completed with ${skippedCount} rows skipped due to invalid format.`);
      } else {
        setImportStatus('success');
      }

      setImportProgress(100);
      setIsImporting(false);
      setTimeout(() => {
        setImportStatus('idle');
        setImportProgress(0);
      }, 5000);
    } catch (err: unknown) {
      setImportStatus('error');
      setImportError((err as Error).message || 'Failed to import CSV');
      setIsImporting(false);
    }
  };

  return {
    isImporting,
    importProgress,
    importStatus,
    importError,
    importFromCSV,
  };
}
