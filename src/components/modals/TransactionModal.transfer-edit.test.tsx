import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransactionModal } from './TransactionModal';
import { Account, Category, Transaction } from '../../types';
import { writeBatch } from 'firebase/firestore';

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn((db, collection, id) => ({ id, path: `${collection}/${id}` })),
  writeBatch: vi.fn(() => ({
    update: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    commit: vi.fn(() => Promise.resolve()),
  })),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(() => Promise.resolve({ docs: [] })),
  increment: vi.fn((value) => value),
}));

vi.mock('../../firebase', () => ({
  db: {},
  auth: {
    currentUser: {
      uid: 'test-user-123',
      email: 'test@example.com',
      emailVerified: true,
    },
  },
}));

vi.mock('../../services/localStorageService', () => ({
  LocalStorageService: {
    getMetadata: vi.fn(() => Promise.resolve(null)),
    setMetadata: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock('../../services/connectionService', () => ({
  ConnectionService: {
    isOnline: vi.fn(() => true),
  },
}));

interface MockBatch {
  update: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  commit: ReturnType<typeof vi.fn>;
}

type UpdateCall = [
  { id: string },
  { description?: string; amount?: number; accountId?: string; type?: string; isConsolidated?: boolean },
];

describe('TransactionModal - Transfer Edit', () => {
  const mockAccounts: Account[] = [
    {
      id: 'account-1',
      name: 'Checking Account',
      type: 'checking',
      balance: 1000,
      initialBalance: 1000,
      initialBalanceDate: '2026-01-01',
      color: '#10b981',
      icon: 'Banknote',
      userId: 'user1',
    },
    {
      id: 'account-2',
      name: 'Savings Account',
      type: 'savings',
      balance: 2000,
      initialBalance: 2000,
      initialBalanceDate: '2026-01-01',
      color: '#3b82f6',
      icon: 'PiggyBank',
      userId: 'user1',
    },
  ];

  const mockCategories: Category[] = [
    {
      id: 'cat1',
      name: 'Food',
      icon: 'Utensils',
      color: '#10b981',
      type: 'expense',
      userId: 'user1',
    },
  ];

  const transferId = 'transfer-123';

  const mockTransferTransactions: Transaction[] = [
    {
      id: 'trans-expense',
      description: 'Transfer to savings',
      amount: 100,
      date: '2026-03-15T12:00:00.000Z',
      accountId: 'account-1',
      categoryId: 'transfer',
      type: 'expense',
      isConsolidated: false,
      userId: 'user1',
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
      isConsolidated: false,
      userId: 'user1',
      transferId,
      toAccountId: 'account-1',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates both paired transactions when editing a transfer', async () => {
    const user = userEvent.setup();
    const mockBatch: MockBatch = {
      update: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      commit: vi.fn(() => Promise.resolve()),
    };
    vi.mocked(writeBatch).mockReturnValue(mockBatch as ReturnType<typeof writeBatch>);

    const onClose = vi.fn();
    const onDelete = vi.fn();

    render(
      <TransactionModal
        isOpen={true}
        onClose={onClose}
        accounts={mockAccounts}
        categories={mockCategories}
        transactions={mockTransferTransactions}
        editingTransaction={mockTransferTransactions[0]}
        userId="user1"
        onDelete={onDelete}
      />
    );

    // Change the description
    const descriptionInput = screen.getByDisplayValue('Transfer to savings');
    await user.clear(descriptionInput);
    await user.type(descriptionInput, 'Updated transfer description');

    // Click save button
    const saveButton = screen.getByText('Salvar Alterações');
    await user.click(saveButton);

    await waitFor(() => {
      // Verify that update was called for both paired transactions
      expect(mockBatch.update).toHaveBeenCalledTimes(2);
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    // Check that both transactions were updated with the new description
    const updateCalls = mockBatch.update.mock.calls as UpdateCall[];
    expect(updateCalls.some((call) => call[0].id === 'trans-expense')).toBe(true);
    expect(updateCalls.some((call) => call[0].id === 'trans-income')).toBe(true);

    // Verify the description was updated in the batch update calls
    updateCalls.forEach((call) => {
      expect(call[1].description).toBe('Updated transfer description');
    });
  });

  it('updates both paired transactions with new amount when editing a transfer', async () => {
    const user = userEvent.setup();
    const mockBatch: MockBatch = {
      update: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      commit: vi.fn(() => Promise.resolve()),
    };
    vi.mocked(writeBatch).mockReturnValue(mockBatch as ReturnType<typeof writeBatch>);

    const onClose = vi.fn();
    const onDelete = vi.fn();

    render(
      <TransactionModal
        isOpen={true}
        onClose={onClose}
        accounts={mockAccounts}
        categories={mockCategories}
        transactions={mockTransferTransactions}
        editingTransaction={mockTransferTransactions[0]}
        userId="user1"
        onDelete={onDelete}
      />
    );

    // Change the amount (amount is in cents in the input)
    const amountInput = screen.getByDisplayValue('100,00');
    await user.clear(amountInput);
    await user.type(amountInput, '20000'); // 200.00

    // Click save button
    const saveButton = screen.getByText('Salvar Alterações');
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockBatch.update).toHaveBeenCalled();
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    // Check that both transactions were updated with the new amount
    const updateCalls = mockBatch.update.mock.calls as UpdateCall[];
    updateCalls.forEach((call) => {
      expect(call[1].amount).toBe(200);
    });
  });

  it('updates both paired transactions when changing account for a transfer', async () => {
    const user = userEvent.setup();
    const mockBatch: MockBatch = {
      update: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      commit: vi.fn(() => Promise.resolve()),
    };
    vi.mocked(writeBatch).mockReturnValue(mockBatch as ReturnType<typeof writeBatch>);

    const onClose = vi.fn();
    const onDelete = vi.fn();

    render(
      <TransactionModal
        isOpen={true}
        onClose={onClose}
        accounts={mockAccounts}
        categories={mockCategories}
        transactions={mockTransferTransactions}
        editingTransaction={mockTransferTransactions[0]}
        userId="user1"
        onDelete={onDelete}
      />
    );

    // Click save button (we're not changing anything, just verifying the logic)
    const saveButton = screen.getByText('Salvar Alterações');
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockBatch.update).toHaveBeenCalledTimes(2);
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    // Verify that the expense transaction has the correct account
    const updateCalls = mockBatch.update.mock.calls as UpdateCall[];
    const expenseUpdate = updateCalls.find((call) => call[0].id === 'trans-expense');
    expect(expenseUpdate?.[1].accountId).toBe('account-1');
    expect(expenseUpdate?.[1].type).toBe('expense');

    // Verify that the income transaction has the correct account
    const incomeUpdate = updateCalls.find((call) => call[0].id === 'trans-income');
    expect(incomeUpdate?.[1].accountId).toBe('account-2');
    expect(incomeUpdate?.[1].type).toBe('income');
  });

  it('preserves consolidated status when editing a transfer', async () => {
    const user = userEvent.setup();
    const mockBatch: MockBatch = {
      update: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      commit: vi.fn(() => Promise.resolve()),
    };
    vi.mocked(writeBatch).mockReturnValue(mockBatch as ReturnType<typeof writeBatch>);

    const consolidatedTransfer = [
      { ...mockTransferTransactions[0], isConsolidated: true },
      { ...mockTransferTransactions[1], isConsolidated: true },
    ];

    const onClose = vi.fn();
    const onDelete = vi.fn();

    render(
      <TransactionModal
        isOpen={true}
        onClose={onClose}
        accounts={mockAccounts}
        categories={mockCategories}
        transactions={consolidatedTransfer}
        editingTransaction={consolidatedTransfer[0]}
        userId="user1"
        onDelete={onDelete}
      />
    );

    // Change description
    const descriptionInput = screen.getByDisplayValue('Transfer to savings');
    await user.clear(descriptionInput);
    await user.type(descriptionInput, 'New description');

    // Click save button
    const saveButton = screen.getByText('Salvar Alterações');
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    // Filter to only transaction updates (not account balance updates)
    const allUpdateCalls = mockBatch.update.mock.calls;
    const transactionUpdates = allUpdateCalls.filter((call: unknown[]) => {
      const ref = call[0] as { path: string };
      return ref.path.startsWith('transactions/');
    }) as UpdateCall[];

    // Verify we have 2 transaction updates (one for each paired transaction)
    expect(transactionUpdates.length).toBe(2);

    transactionUpdates.forEach((call) => {
      // Verify isConsolidated is present and true
      expect(call[1]).toHaveProperty('isConsolidated');
      expect(call[1].isConsolidated).toBe(true);
    });
  });
});
