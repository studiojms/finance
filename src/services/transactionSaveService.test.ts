import { describe, expect, it, vi, beforeEach } from 'vitest';
import { saveTransaction } from './transactionSaveService';
import { DatabaseService } from './databaseService';
import { Transaction } from '../types';

vi.mock('./databaseService', () => ({
  DatabaseService: {
    executeBatchWrite: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock('../config', () => ({
  isFirebase: vi.fn(() => true),
  isSupabase: vi.fn(() => false),
}));

describe('transactionSaveService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates paired transfer transactions with balance updates', async () => {
    await saveTransaction({
      description: 'Move money',
      amount: 250,
      date: '2026-06-10',
      accountId: 'account-1',
      categoryId: '',
      toAccountId: 'account-2',
      type: 'transfer',
      isConsolidated: true,
      userId: 'user-1',
      frequency: 'monthly',
      installments: '1',
      isInfinite: false,
      editMode: 'only',
      editingTransaction: null,
      transactions: [],
    });

    expect(DatabaseService.executeBatchWrite).toHaveBeenCalled();
    const operations = vi.mocked(DatabaseService.executeBatchWrite).mock.calls[0][0];

    const createOperations = operations.filter((operation) => operation.type === 'create');
    expect(createOperations).toHaveLength(2);

    const expense = createOperations.find((operation) => operation.data?.type === 'expense');
    const income = createOperations.find((operation) => operation.data?.type === 'income');

    expect(expense?.data).toMatchObject({
      accountId: 'account-1',
      categoryId: 'transfer',
      transferId: income?.data?.transferId,
    });
    expect(income?.data).toMatchObject({
      accountId: 'account-2',
      categoryId: 'transfer',
    });

    const incrementOperations = operations.filter((operation) => operation.type === 'increment');
    expect(incrementOperations).toHaveLength(2);
    expect(incrementOperations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ documentId: 'account-1', value: -250 }),
        expect.objectContaining({ documentId: 'account-2', value: 250 }),
      ])
    );
  });

  it('updates both paired transfer transactions when editing', async () => {
    const transferId = 'transfer-123';
    const transactions: Transaction[] = [
      {
        id: 'trans-expense',
        description: 'Transfer to savings',
        amount: 100,
        date: '2026-03-15T12:00:00.000Z',
        accountId: 'account-1',
        categoryId: 'transfer',
        type: 'expense',
        isConsolidated: true,
        userId: 'user-1',
        transferId,
        toAccountId: 'account-2',
      },
      {
        id: 'trans-income',
        description: 'Transfer to savings',
        amount: 100,
        date: '2026-03-15T12:00:00.000Z',
        accountId: 'account-2',
        categoryId: 'transfer',
        type: 'income',
        isConsolidated: true,
        userId: 'user-1',
        transferId,
        toAccountId: 'account-1',
      },
    ];

    await saveTransaction({
      description: 'Updated transfer',
      amount: 150,
      date: '2026-06-10',
      accountId: 'account-1',
      categoryId: 'transfer',
      toAccountId: 'account-2',
      type: 'transfer',
      isConsolidated: true,
      userId: 'user-1',
      frequency: 'monthly',
      installments: '1',
      isInfinite: false,
      editMode: 'only',
      editingTransaction: transactions[0],
      transactions,
    });

    const operations = vi.mocked(DatabaseService.executeBatchWrite).mock.calls[0][0];
    const updateOperations = operations.filter((operation) => operation.type === 'update');

    expect(updateOperations).toHaveLength(2);
    expect(updateOperations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          documentId: 'trans-expense',
          data: expect.objectContaining({ description: 'Updated transfer', amount: 150, accountId: 'account-1' }),
        }),
        expect.objectContaining({
          documentId: 'trans-income',
          data: expect.objectContaining({ description: 'Updated transfer', amount: 150, accountId: 'account-2' }),
        }),
      ])
    );
  });
});
