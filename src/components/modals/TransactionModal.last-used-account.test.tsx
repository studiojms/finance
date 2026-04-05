import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransactionModal } from './TransactionModal';
import { Account, Category, Transaction } from '../../types';
import { LocalStorageService } from '../../services/localStorageService';

vi.mock('firebase/firestore', () => ({
  addDoc: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  updateDoc: vi.fn(),
  writeBatch: vi.fn(() => ({
    update: vi.fn(),
    delete: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
    set: vi.fn(),
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

vi.mock('../../services/databaseService', () => ({
  DatabaseService: {
    addDocument: vi.fn(),
  },
}));

vi.mock('../../services/localStorageService', () => ({
  LocalStorageService: {
    getMetadata: vi.fn(),
    setMetadata: vi.fn(),
  },
}));

describe('TransactionModal - Last Used Account', () => {
  const mockAccounts: Account[] = [
    {
      id: 'account1',
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
      id: 'account2',
      name: 'Savings Account',
      type: 'savings',
      balance: 5000,
      initialBalance: 5000,
      initialBalanceDate: '2026-01-01',
      color: '#3b82f6',
      icon: 'PiggyBank',
      userId: 'user1',
    },
    {
      id: 'account3',
      name: 'Credit Card',
      type: 'credit_card',
      balance: -500,
      initialBalance: 0,
      initialBalanceDate: '2026-01-01',
      color: '#ef4444',
      icon: 'CreditCard',
      userId: 'user1',
    },
  ];

  const mockCategories: Category[] = [
    {
      id: 'cat1',
      name: 'Food',
      icon: 'Utensils',
      color: '#ef4444',
      type: 'expense',
      userId: 'user1',
    },
  ];

  const mockTransactions: Transaction[] = [];

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    accounts: mockAccounts,
    categories: mockCategories,
    transactions: mockTransactions,
    editingTransaction: null,
    userId: 'user1',
    initialType: 'expense' as const,
    onDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('defaults to first account when no last used account exists', async () => {
    vi.mocked(LocalStorageService.getMetadata).mockResolvedValue(null);

    render(<TransactionModal {...defaultProps} />);

    await waitFor(() => {
      const accountSelect = screen.getByDisplayValue('Checking Account');
      expect(accountSelect).toBeVisible();
    });
  });

  it('loads last used account when it exists and is valid', async () => {
    vi.mocked(LocalStorageService.getMetadata).mockResolvedValue('account2');

    render(<TransactionModal {...defaultProps} />);

    await waitFor(() => {
      const accountSelect = screen.getByDisplayValue('Savings Account');
      expect(accountSelect).toBeVisible();
    });
  });

  it('falls back to first account if last used account no longer exists', async () => {
    vi.mocked(LocalStorageService.getMetadata).mockResolvedValue('nonexistent-account');

    render(<TransactionModal {...defaultProps} />);

    await waitFor(() => {
      const accountSelect = screen.getByDisplayValue('Checking Account');
      expect(accountSelect).toBeVisible();
    });
  });

  it('falls back to first account if getMetadata fails', async () => {
    vi.mocked(LocalStorageService.getMetadata).mockRejectedValue(new Error('Storage error'));

    render(<TransactionModal {...defaultProps} />);

    await waitFor(() => {
      const accountSelect = screen.getByDisplayValue('Checking Account');
      expect(accountSelect).toBeVisible();
    });
  });

  it('saves account as last used when creating a new transaction', async () => {
    const user = userEvent.setup();
    vi.mocked(LocalStorageService.getMetadata).mockResolvedValue(null);
    vi.mocked(LocalStorageService.setMetadata).mockResolvedValue();

    render(<TransactionModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Checking Account')).toBeVisible();
    });

    const accountSelect = screen.getByDisplayValue('Checking Account');
    await user.click(accountSelect);
    await user.selectOptions(accountSelect, 'account3');

    await waitFor(() => {
      expect(screen.getByDisplayValue('Credit Card')).toBeVisible();
    });

    const descriptionInput = screen.getByPlaceholderText('Ex: Supermercado');
    await user.type(descriptionInput, 'Test transaction');

    const amountInput = screen.getByDisplayValue('0,00');
    await user.clear(amountInput);
    await user.type(amountInput, '5000');

    const saveButton = screen.getByRole('button', { name: /confirmar/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(LocalStorageService.setMetadata).toHaveBeenCalledWith('lastUsedAccountId', 'account3');
    });
  });

  it('does not save last used account when editing a transaction', async () => {
    const user = userEvent.setup();
    const editingTransaction: Transaction = {
      id: 'trans1',
      description: 'Existing transaction',
      amount: 100,
      date: '2026-04-01T12:00:00.000Z',
      accountId: 'account1',
      categoryId: 'cat1',
      type: 'expense',
      isConsolidated: true,
      userId: 'user1',
    };

    vi.mocked(LocalStorageService.getMetadata).mockResolvedValue('account2');
    vi.mocked(LocalStorageService.setMetadata).mockResolvedValue();

    render(<TransactionModal {...defaultProps} editingTransaction={editingTransaction} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Existing transaction')).toBeVisible();
    });

    const saveButton = screen.getByRole('button', { name: /salvar/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    expect(LocalStorageService.setMetadata).not.toHaveBeenCalled();
  });

  it('does not overwrite last used account if setMetadata fails silently', async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.mocked(LocalStorageService.getMetadata).mockResolvedValue('account1');
    vi.mocked(LocalStorageService.setMetadata).mockRejectedValue(new Error('Storage error'));

    render(<TransactionModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Checking Account')).toBeVisible();
    });

    const descriptionInput = screen.getByPlaceholderText('Ex: Supermercado');
    await user.type(descriptionInput, 'Test transaction');

    const amountInput = screen.getByDisplayValue('0,00');
    await user.clear(amountInput);
    await user.type(amountInput, '5000');

    const saveButton = screen.getByRole('button', { name: /confirmar/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save last used account');
    consoleErrorSpy.mockRestore();
  });

  it('remembers account across multiple transactions', async () => {
    const user = userEvent.setup();
    vi.mocked(LocalStorageService.getMetadata).mockResolvedValue('account2');
    vi.mocked(LocalStorageService.setMetadata).mockResolvedValue();

    const { unmount } = render(<TransactionModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Savings Account')).toBeVisible();
    });

    const descriptionInput = screen.getByPlaceholderText('Ex: Supermercado');
    await user.type(descriptionInput, 'First transaction');

    const amountInput = screen.getByDisplayValue('0,00');
    await user.clear(amountInput);
    await user.type(amountInput, '1000');

    const saveButton = screen.getByRole('button', { name: /confirmar/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(LocalStorageService.setMetadata).toHaveBeenCalledWith('lastUsedAccountId', 'account2');
    });

    unmount();

    vi.clearAllMocks();
    vi.mocked(LocalStorageService.getMetadata).mockResolvedValue('account2');

    render(<TransactionModal {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Savings Account')).toBeVisible();
    });

    expect(LocalStorageService.getMetadata).toHaveBeenCalledWith('lastUsedAccountId');
  });

  it('uses editing transaction account when editing, ignoring last used account', async () => {
    const editingTransaction: Transaction = {
      id: 'trans1',
      description: 'Transaction to edit',
      amount: 100,
      date: '2026-04-01T12:00:00.000Z',
      accountId: 'account3',
      categoryId: 'cat1',
      type: 'expense',
      isConsolidated: true,
      userId: 'user1',
    };

    vi.mocked(LocalStorageService.getMetadata).mockResolvedValue('account1');

    render(<TransactionModal {...defaultProps} editingTransaction={editingTransaction} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Credit Card')).toBeVisible();
    });

    expect(LocalStorageService.getMetadata).not.toHaveBeenCalled();
  });
});
