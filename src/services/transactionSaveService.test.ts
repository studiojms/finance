import { describe, expect, it, vi, beforeEach } from 'vitest';
import { format, parseISO } from 'date-fns';
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

  it('creates monthly installments on the same day of each month', async () => {
    await saveTransaction({
      description: 'Payment',
      amount: 100,
      date: '2026-06-30',
      accountId: 'account-1',
      categoryId: 'category-1',
      toAccountId: '',
      type: 'expense',
      isConsolidated: false,
      userId: 'user-1',
      frequency: 'monthly',
      installments: '4',
      isInfinite: false,
      editMode: 'only',
      editingTransaction: null,
      transactions: [],
    });

    const operations = vi.mocked(DatabaseService.executeBatchWrite).mock.calls[0][0];
    const createOperations = operations.filter((operation) => operation.type === 'create');
    const dates = createOperations.map((operation) =>
      format(parseISO(operation.data?.date as string), 'yyyy-MM-dd')
    );

    expect(dates).toEqual(['2026-06-30', '2026-07-30', '2026-08-30', '2026-09-30']);
  });

  it('clamps monthly installments to the last day of shorter months', async () => {
    await saveTransaction({
      description: 'Payment',
      amount: 100,
      date: '2026-01-31',
      accountId: 'account-1',
      categoryId: 'category-1',
      toAccountId: '',
      type: 'expense',
      isConsolidated: false,
      userId: 'user-1',
      frequency: 'monthly',
      installments: '3',
      isInfinite: false,
      editMode: 'only',
      editingTransaction: null,
      transactions: [],
    });

    const operations = vi.mocked(DatabaseService.executeBatchWrite).mock.calls[0][0];
    const createOperations = operations.filter((operation) => operation.type === 'create');
    const dates = createOperations.map((operation) =>
      format(parseISO(operation.data?.date as string), 'yyyy-MM-dd')
    );

    expect(dates).toEqual(['2026-01-31', '2026-02-28', '2026-03-31']);
  });

  it('updates future installments using monthly cadence', async () => {
    const installmentId = 'installment-1';
    const transactions: Transaction[] = [
      {
        id: 'trans-1',
        description: 'Payment (1/3)',
        amount: 100,
        date: '2026-06-29T03:00:00.000Z',
        accountId: 'account-1',
        categoryId: 'category-1',
        type: 'expense',
        isConsolidated: false,
        userId: 'user-1',
        installmentId,
        installmentNumber: 1,
        totalInstallments: 3,
        frequency: 'monthly',
      },
      {
        id: 'trans-2',
        description: 'Payment (2/3)',
        amount: 100,
        date: '2026-07-29T03:00:00.000Z',
        accountId: 'account-1',
        categoryId: 'category-1',
        type: 'expense',
        isConsolidated: false,
        userId: 'user-1',
        installmentId,
        installmentNumber: 2,
        totalInstallments: 3,
        frequency: 'monthly',
      },
      {
        id: 'trans-3',
        description: 'Payment (3/3)',
        amount: 100,
        date: '2026-08-29T03:00:00.000Z',
        accountId: 'account-1',
        categoryId: 'category-1',
        type: 'expense',
        isConsolidated: false,
        userId: 'user-1',
        installmentId,
        installmentNumber: 3,
        totalInstallments: 3,
        frequency: 'monthly',
      },
    ];

    await saveTransaction({
      description: 'Payment',
      amount: 100,
      date: '2026-06-30',
      accountId: 'account-1',
      categoryId: 'category-1',
      toAccountId: '',
      type: 'expense',
      isConsolidated: false,
      userId: 'user-1',
      frequency: 'monthly',
      installments: '3',
      isInfinite: false,
      editMode: 'future',
      editingTransaction: transactions[0],
      transactions,
    });

    const operations = vi.mocked(DatabaseService.executeBatchWrite).mock.calls[0][0];
    const updateOperations = operations.filter((operation) => operation.type === 'update');
    const dates = updateOperations.map((operation) =>
      format(parseISO(operation.data?.date as string), 'yyyy-MM-dd')
    );

    expect(dates).toEqual(['2026-06-30', '2026-07-30', '2026-08-30']);
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
