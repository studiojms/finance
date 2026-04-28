import { renderHook } from '@testing-library/react';
import { useTransactionOperations } from './useTransactionOperations';
import { Transaction } from '../types';
import { DatabaseService } from '../services/databaseService';

vi.mock('../config', () => ({
  isFirebase: vi.fn(() => true),
  isSupabase: vi.fn(() => false),
}));

vi.mock('../services/databaseService', () => ({
  DatabaseService: {
    executeBatchWrite: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('useTransactionOperations', () => {
  const mockTransactions: Transaction[] = [
    {
      id: 't1',
      description: 'Test Transaction',
      amount: 100,
      date: '2024-01-15T12:00:00.000Z',
      accountId: 'acc1',
      categoryId: 'cat1',
      type: 'expense',
      isConsolidated: true,
      userId: 'user1',
    },
    {
      id: 't2',
      description: 'Installment 1/3',
      amount: 50,
      date: '2024-01-15T12:00:00.000Z',
      accountId: 'acc1',
      categoryId: 'cat1',
      type: 'expense',
      isConsolidated: true,
      userId: 'user1',
      installmentId: 'inst1',
      installmentNumber: 1,
    },
    {
      id: 't3',
      description: 'Installment 2/3',
      amount: 50,
      date: '2024-02-15T12:00:00.000Z',
      accountId: 'acc1',
      categoryId: 'cat1',
      type: 'expense',
      isConsolidated: true,
      userId: 'user1',
      installmentId: 'inst1',
      installmentNumber: 2,
    },
    {
      id: 't4',
      description: 'Installment 3/3',
      amount: 50,
      date: '2024-03-15T12:00:00.000Z',
      accountId: 'acc1',
      categoryId: 'cat1',
      type: 'expense',
      isConsolidated: true,
      userId: 'user1',
      installmentId: 'inst1',
      installmentNumber: 3,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('toggleConsolidated', () => {
    it('toggles transaction consolidated status', async () => {
      const { result } = renderHook(() => useTransactionOperations(mockTransactions));

      await result.current.toggleConsolidated(mockTransactions[0]);

      expect(DatabaseService.executeBatchWrite).toHaveBeenCalled();
      const operations = (DatabaseService.executeBatchWrite as any).mock.calls[0][0];
      expect(operations).toHaveLength(2);
      expect(operations[0].type).toBe('update');
      expect(operations[0].collection).toBe('transactions');
      expect(operations[1].type).toBe('increment');
      expect(operations[1].collection).toBe('accounts');
    });

    it('updates account balance for expense transaction', async () => {
      const { result } = renderHook(() => useTransactionOperations(mockTransactions));

      await result.current.toggleConsolidated(mockTransactions[0]);

      const operations = (DatabaseService.executeBatchWrite as any).mock.calls[0][0];
      const incrementOp = operations.find((op: any) => op.type === 'increment');
      expect(incrementOp.value).toBe(100);
    });

    it('handles transfer transactions', async () => {
      const transferTransactions: Transaction[] = [
        {
          id: 't5',
          description: 'Transfer Out',
          amount: 200,
          date: '2024-01-15T12:00:00.000Z',
          accountId: 'acc1',
          toAccountId: 'acc2',
          categoryId: 'cat1',
          type: 'expense',
          isConsolidated: true,
          userId: 'user1',
          transferId: 'transfer1',
        },
        {
          id: 't6',
          description: 'Transfer In',
          amount: 200,
          date: '2024-01-15T12:00:00.000Z',
          accountId: 'acc2',
          categoryId: 'cat1',
          type: 'income',
          isConsolidated: true,
          userId: 'user1',
          transferId: 'transfer1',
        },
      ];

      const { result } = renderHook(() => useTransactionOperations(transferTransactions));

      await result.current.toggleConsolidated(transferTransactions[0]);

      expect(DatabaseService.executeBatchWrite).toHaveBeenCalled();
      const operations = (DatabaseService.executeBatchWrite as any).mock.calls[0][0];
      expect(operations.length).toBeGreaterThan(2);
    });
  });

  describe('deleteTransaction', () => {
    it('deletes a single transaction when mode is "only"', async () => {
      const { result } = renderHook(() => useTransactionOperations(mockTransactions));

      await result.current.deleteTransaction(mockTransactions[0], 'only');

      expect(DatabaseService.executeBatchWrite).toHaveBeenCalled();
      const operations = (DatabaseService.executeBatchWrite as any).mock.calls[0][0];
      const deleteOps = operations.filter((op: any) => op.type === 'delete');
      expect(deleteOps).toHaveLength(1);
    });

    it('deletes future installments when mode is "future"', async () => {
      const { result } = renderHook(() => useTransactionOperations(mockTransactions));

      await result.current.deleteTransaction(mockTransactions[1], 'future');

      expect(DatabaseService.executeBatchWrite).toHaveBeenCalled();
      const operations = (DatabaseService.executeBatchWrite as any).mock.calls[0][0];
      const deleteOps = operations.filter((op: any) => op.type === 'delete');
      expect(deleteOps.length).toBeGreaterThanOrEqual(3);
    });

    it('only deletes single transaction if no installmentId', async () => {
      const { result } = renderHook(() => useTransactionOperations(mockTransactions));

      await result.current.deleteTransaction(mockTransactions[0], 'future');

      expect(DatabaseService.executeBatchWrite).toHaveBeenCalled();
      const operations = (DatabaseService.executeBatchWrite as any).mock.calls[0][0];
      const deleteOps = operations.filter((op: any) => op.type === 'delete');
      expect(deleteOps).toHaveLength(1);
    });

    it('reverses balance changes for consolidated transactions', async () => {
      const { result } = renderHook(() => useTransactionOperations(mockTransactions));

      await result.current.deleteTransaction(mockTransactions[0]);

      expect(DatabaseService.executeBatchWrite).toHaveBeenCalled();
      const operations = (DatabaseService.executeBatchWrite as any).mock.calls[0][0];
      const incrementOps = operations.filter((op: any) => op.type === 'increment');
      expect(incrementOps.length).toBeGreaterThan(0);
    });
  });
});
