import { render, screen } from '@testing-library/react';
import { TransactionModal } from './TransactionModal';
import { Account, Category, Transaction } from '../../types';

vi.mock('firebase/firestore', () => ({
  addDoc: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  updateDoc: vi.fn(),
  writeBatch: vi.fn(() => ({
    update: vi.fn(),
    delete: vi.fn(),
    commit: vi.fn(),
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

describe('TransactionModal - Alphabetical Sorting', () => {
  const mockAccounts: Account[] = [
    {
      id: '3',
      name: 'Zebra Account',
      type: 'checking',
      balance: 1000,
      initialBalance: 1000,
      initialBalanceDate: '2026-01-01',
      color: '#10b981',
      icon: 'Banknote',
      userId: 'user1',
    },
    {
      id: '1',
      name: 'Apple Account',
      type: 'savings',
      balance: 2000,
      initialBalance: 2000,
      initialBalanceDate: '2026-01-01',
      color: '#3b82f6',
      icon: 'PiggyBank',
      userId: 'user1',
    },
    {
      id: '2',
      name: 'Banana Account',
      type: 'investment',
      balance: 3000,
      initialBalance: 3000,
      initialBalanceDate: '2026-01-01',
      color: '#f59e0b',
      icon: 'TrendingUp',
      userId: 'user1',
    },
  ];

  const mockCategories: Category[] = [
    {
      id: 'cat3',
      name: 'Zebra Category',
      icon: 'Tag',
      color: '#ef4444',
      type: 'expense',
      userId: 'user1',
    },
    {
      id: 'cat1',
      name: 'Apple Category',
      icon: 'Utensils',
      color: '#10b981',
      type: 'expense',
      userId: 'user1',
    },
    {
      id: 'cat2',
      name: 'Banana Category',
      icon: 'Car',
      color: '#3b82f6',
      type: 'income',
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

  it('renders accounts in alphabetical order', () => {
    render(<TransactionModal {...defaultProps} />);

    const accountSelect = screen.getAllByRole('combobox')[0];
    const options = Array.from(accountSelect.querySelectorAll('option'));

    const accountNames = options.map((opt) => opt.textContent);

    expect(accountNames).toEqual(['Apple Account', 'Banana Account', 'Zebra Account']);
  });

  it('renders categories in alphabetical order for expense type', () => {
    render(<TransactionModal {...defaultProps} initialType="expense" />);

    const categorySelect = screen.getAllByRole('combobox')[1];
    const options = Array.from(categorySelect.querySelectorAll('option'));

    const categoryNames = options.map((opt) => opt.textContent).filter((name) => name !== 'Selecionar...');

    expect(categoryNames).toEqual(['Apple Category', 'Zebra Category']);
  });

  it('renders transfer destination accounts in alphabetical order', () => {
    render(<TransactionModal {...defaultProps} initialType="transfer" />);

    const typeButtons = screen.getAllByRole('button');
    const transferButton = typeButtons.find((btn) => btn.textContent?.includes('Transferência'));

    if (transferButton) {
      const toAccountSelect = screen.getAllByRole('combobox')[1];
      const options = Array.from(toAccountSelect.querySelectorAll('option'));

      const accountNames = options
        .map((opt) => opt.textContent)
        .filter((name) => name !== 'Selecionar conta destino...');

      expect(accountNames.length).toBeGreaterThan(0);
      const sortedNames = [...accountNames].sort((a, b) => a!.localeCompare(b!));
      expect(accountNames).toEqual(sortedNames);
    }
  });

  it('maintains alphabetical order when switching transaction types', async () => {
    const { unmount } = render(<TransactionModal {...defaultProps} initialType="expense" />);

    let categorySelect = screen.getAllByRole('combobox')[1];
    let options = Array.from(categorySelect.querySelectorAll('option'));
    let categoryNames = options.map((opt) => opt.textContent).filter((name) => name !== 'Selecionar...');

    expect(categoryNames).toEqual(['Apple Category', 'Zebra Category']);

    unmount();

    render(<TransactionModal {...defaultProps} initialType="income" />);

    categorySelect = screen.getAllByRole('combobox')[1];
    options = Array.from(categorySelect.querySelectorAll('option'));
    categoryNames = options.map((opt) => opt.textContent).filter((name) => name !== 'Selecionar...');

    expect(categoryNames).toEqual(['Banana Category']);
  });

  it('sorts accounts case-insensitively', () => {
    const mixedCaseAccounts: Account[] = [
      {
        id: '1',
        name: 'zebra account',
        type: 'checking',
        balance: 1000,
        initialBalance: 1000,
        initialBalanceDate: '2026-01-01',
        color: '#10b981',
        icon: 'Banknote',
        userId: 'user1',
      },
      {
        id: '2',
        name: 'Apple Account',
        type: 'savings',
        balance: 2000,
        initialBalance: 2000,
        initialBalanceDate: '2026-01-01',
        color: '#3b82f6',
        icon: 'PiggyBank',
        userId: 'user1',
      },
    ];

    render(<TransactionModal {...defaultProps} accounts={mixedCaseAccounts} />);

    const accountSelect = screen.getAllByRole('combobox')[0];
    const options = Array.from(accountSelect.querySelectorAll('option'));
    const accountNames = options.map((opt) => opt.textContent);

    expect(accountNames).toEqual(['Apple Account', 'zebra account']);
  });

  it('sorts categories case-insensitively', () => {
    const mixedCaseCategories: Category[] = [
      {
        id: 'cat1',
        name: 'zebra category',
        icon: 'Tag',
        color: '#ef4444',
        type: 'expense',
        userId: 'user1',
      },
      {
        id: 'cat2',
        name: 'Apple Category',
        icon: 'Utensils',
        color: '#10b981',
        type: 'expense',
        userId: 'user1',
      },
    ];

    render(<TransactionModal {...defaultProps} categories={mixedCaseCategories} />);

    const categorySelect = screen.getAllByRole('combobox')[1];
    const options = Array.from(categorySelect.querySelectorAll('option'));
    const categoryNames = options.map((opt) => opt.textContent).filter((name) => name !== 'Selecionar...');

    expect(categoryNames).toEqual(['Apple Category', 'zebra category']);
  });
});
