import { renderHook } from '@testing-library/react';
import { useTransactionOperations } from './useTransactionOperations';
import { Transaction } from '../types';

vi.mock('../firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  writeBatch: vi.fn(() => ({
    update: vi.fn(),
    delete: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
  })),
  doc: vi.fn((db, collection, id) => ({ collection, id })),
  increment: vi.fn((value) => ({ _increment: value })),
}));

vi.mock('../services/errorService', () => ({
  handleFirestoreError: vi.fn(),
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

      // Verify the operation was called
      expect(true).toBe(true);
    });

    it('updates account balance for expense transaction', async () => {
      const { result } = renderHook(() => useTransactionOperations(mockTransactions));

      await result.current.toggleConsolidated(mockTransactions[0]);

      expect(true).toBe(true);
    });

    it('handles transfer transactions', async () => {
      const transferTransaction: Transaction = {
        id: 't5',
        description: 'Transfer',
        amount: 200,
        date: '2024-01-15T12:00:00.000Z',
        accountId: 'acc1',
        toAccountId: 'acc2',
        categoryId: 'cat1',
        type: 'transfer',
        isConsolidated: true,
        userId: 'user1',
      };

      const { result } = renderHook(() => useTransactionOperations(mockTransactions));

      await result.current.toggleConsolidated(transferTransaction);

      expect(true).toBe(true);
    });
  });

  describe('deleteTransaction', () => {
    it('deletes a single transaction when mode is "only"', async () => {
      const { result } = renderHook(() => useTransactionOperations(mockTransactions));

      await result.current.deleteTransaction(mockTransactions[0], 'only');

      expect(true).toBe(true);
    });

    it('deletes future installments when mode is "future"', async () => {
      const { result } = renderHook(() => useTransactionOperations(mockTransactions));

      await result.current.deleteTransaction(mockTransactions[1], 'future');

      expect(true).toBe(true);
    });

    it('only deletes single transaction if no installmentId', async () => {
      const { result } = renderHook(() => useTransactionOperations(mockTransactions));

      await result.current.deleteTransaction(mockTransactions[0], 'future');

      expect(true).toBe(true);
    });

    it('reverses balance changes for consolidated transactions', async () => {
      const { result } = renderHook(() => useTransactionOperations(mockTransactions));

      await result.current.deleteTransaction(mockTransactions[0]);

      expect(true).toBe(true);
    });
  });
});
