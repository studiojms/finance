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

describe('TransactionModal - Transfer Create', () => {
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

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    accounts: mockAccounts,
    categories: mockCategories,
    transactions: [] as Transaction[],
    editingTransaction: null,
    userId: 'user1',
    initialType: 'transfer' as const,
    onDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('auto-selects a destination account when creating a transfer', async () => {
    render(<TransactionModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Savings Account')).toBeInTheDocument();
    });
  });

  it('creates a transfer when the form is submitted', async () => {
    const user = userEvent.setup();
    render(<TransactionModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Checking Account')).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText('Ex: Supermercado'), 'Transfer to savings');
    await user.clear(screen.getByDisplayValue('0,00'));
    await user.type(screen.getByDisplayValue('0,00'), '15000');

    await user.click(screen.getByText('Confirmar Transferência'));

    await waitFor(() => {
      expect(saveTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Transfer to savings',
          amount: 150,
          type: 'transfer',
          accountId: 'account-1',
          toAccountId: 'account-2',
        })
      );
    });

    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
