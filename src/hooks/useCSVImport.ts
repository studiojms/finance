import { useState } from 'react';
import { writeBatch, doc, collection, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { CSVService } from '../services/csvService';
import { Account, Category, Transaction } from '../types';
import { format } from 'date-fns';
import { handleFirestoreError } from '../services/errorService';

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
    if (!db) {
      setImportError('Database not initialized');
      setImportStatus('error');
      return;
    }

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
        const batch = writeBatch(db);
        const accountBalanceChanges: Record<string, number> = {};
        let hasOps = false;

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
            const accRef = doc(collection(db, 'accounts'));
            accountId = accRef.id;
            tempAccounts[row.account.toLowerCase()] = accountId;
            batch.set(accRef, {
              name: row.account,
              type: 'checking',
              balance: 0,
              initialBalance: 0,
              initialBalanceDate: format(new Date(), 'yyyy-MM-dd'),
              color: '#94a3b8',
              userId,
            });
          }

          let categoryId =
            categories.find(
              (c) => c.name.toLowerCase() === row.category.toLowerCase() && (c.type === type || c.type === 'both')
            )?.id || tempCategories[row.category.toLowerCase() + type];
          if (!categoryId) {
            const catRef = doc(collection(db, 'categories'));
            categoryId = catRef.id;
            tempCategories[row.category.toLowerCase() + type] = categoryId;
            batch.set(catRef, {
              name: row.category,
              icon: 'Plus',
              color: '#94a3b8',
              type: type,
              userId,
            });
          }

          const tRef = doc(collection(db, 'transactions'));
          batch.set(tRef, {
            description: row.description,
            amount: absAmount,
            date,
            accountId,
            categoryId,
            type,
            isConsolidated: true,
            userId,
          });

          accountBalanceChanges[accountId] = (accountBalanceChanges[accountId] || 0) + parsedAmount;
          hasOps = true;
        }

        if (hasOps) {
          for (const accId in accountBalanceChanges) {
            const accRef = doc(db, 'accounts', accId);
            batch.update(accRef, { balance: increment(accountBalanceChanges[accId]) });
          }

          try {
            await batch.commit();
            const currentChunk = Math.floor(i / CHUNK_SIZE) + 1;
            setImportProgress(Math.round((currentChunk / totalChunks) * 100));
          } catch (err: any) {
            setImportStatus('error');
            setImportError(err.message || 'Error processing batch.');
            setIsImporting(false);
            handleFirestoreError(err, 'write', 'import');
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
    } catch (err: any) {
      setImportStatus('error');
      setImportError(err.message || 'Failed to import CSV');
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
