import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransactionModal } from './TransactionModal';
import { Account, Category, Transaction } from '../../types';
import { saveTransaction } from '../../services/transactionSaveService';

vi.mock('../../services/transactionSaveService', () => ({
  saveTransaction: vi.fn(() => Promise.resolve()),
}));

vi.mock('../../services/databaseService', () => ({
  DatabaseService: {
    addDocument: vi.fn(),
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
    const onClose = vi.fn();

    render(
      <TransactionModal
        isOpen={true}
        onClose={onClose}
        accounts={mockAccounts}
        categories={mockCategories}
        transactions={mockTransferTransactions}
        editingTransaction={mockTransferTransactions[0]}
        userId="user1"
        onDelete={vi.fn()}
      />
    );

    const descriptionInput = screen.getByDisplayValue('Transfer to savings');
    await user.clear(descriptionInput);
    await user.type(descriptionInput, 'Updated transfer description');
    await user.click(screen.getByText('Salvar Alterações'));

    await waitFor(() => {
      expect(saveTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Updated transfer description',
          amount: 100,
          accountId: 'account-1',
          toAccountId: 'account-2',
          editingTransaction: mockTransferTransactions[0],
          transactions: mockTransferTransactions,
        })
      );
    });
  });

  it('updates both paired transactions with new amount when editing a transfer', async () => {
    const user = userEvent.setup();

    render(
      <TransactionModal
        isOpen={true}
        onClose={vi.fn()}
        accounts={mockAccounts}
        categories={mockCategories}
        transactions={mockTransferTransactions}
        editingTransaction={mockTransferTransactions[0]}
        userId="user1"
        onDelete={vi.fn()}
      />
    );

    const amountInput = screen.getByDisplayValue('100,00');
    await user.clear(amountInput);
    await user.type(amountInput, '20000');
    await user.click(screen.getByText('Salvar Alterações'));

    await waitFor(() => {
      expect(saveTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 200,
        })
      );
    });
  });

  it('updates both paired transactions when changing account for a transfer', async () => {
    const user = userEvent.setup();

    render(
      <TransactionModal
        isOpen={true}
        onClose={vi.fn()}
        accounts={mockAccounts}
        categories={mockCategories}
        transactions={mockTransferTransactions}
        editingTransaction={mockTransferTransactions[0]}
        userId="user1"
        onDelete={vi.fn()}
      />
    );

    await user.click(screen.getByText('Salvar Alterações'));

    await waitFor(() => {
      expect(saveTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: 'account-1',
          toAccountId: 'account-2',
        })
      );
    });
  });

  it('preserves consolidated status when editing a transfer', async () => {
    const user = userEvent.setup();
    const consolidatedTransfer = [
      { ...mockTransferTransactions[0], isConsolidated: true },
      { ...mockTransferTransactions[1], isConsolidated: true },
    ];

    render(
      <TransactionModal
        isOpen={true}
        onClose={vi.fn()}
        accounts={mockAccounts}
        categories={mockCategories}
        transactions={consolidatedTransfer}
        editingTransaction={consolidatedTransfer[0]}
        userId="user1"
        onDelete={vi.fn()}
      />
    );

    const descriptionInput = screen.getByDisplayValue('Transfer to savings');
    await user.clear(descriptionInput);
    await user.type(descriptionInput, 'New description');
    await user.click(screen.getByText('Salvar Alterações'));

    await waitFor(() => {
      expect(saveTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'New description',
          isConsolidated: true,
        })
      );
    });
  });
});
