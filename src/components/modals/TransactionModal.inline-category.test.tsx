import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransactionModal } from './TransactionModal';
import { Account, Category, Transaction } from '../../types';
import { DatabaseService } from '../../services/databaseService';

vi.mock('firebase/firestore', () => ({
  addDoc: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  updateDoc: vi.fn(),
  writeBatch: vi.fn(() => ({
    update: vi.fn(),
    delete: vi.fn(),
    commit: vi.fn(),
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

describe('TransactionModal - Inline Category Creation', () => {
  const mockAccounts: Account[] = [
    {
      id: '1',
      name: 'Conta Corrente',
      type: 'checking',
      balance: 1000,
      initialBalance: 1000,
      initialBalanceDate: '2026-01-01',
      color: '#10b981',
      icon: 'Banknote',
      userId: 'user1',
    },
  ];

  const mockCategories: Category[] = [
    {
      id: 'cat1',
      name: 'Alimentação',
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

  it('shows plus button next to category select', () => {
    render(<TransactionModal {...defaultProps} />);

    const plusButtons = screen.getAllByRole('button');
    const categoryPlusButton = plusButtons.find((btn) => {
      const svg = btn.querySelector('svg');
      return svg && btn.className.includes('emerald');
    });

    expect(categoryPlusButton).toBeDefined();
  });

  it('clicking plus button shows inline category creation form', async () => {
    const user = userEvent.setup();
    render(<TransactionModal {...defaultProps} />);

    const plusButtons = screen.getAllByRole('button');
    const categoryPlusButton = plusButtons.find((btn) => {
      const svg = btn.querySelector('svg');
      return svg && btn.className.includes('emerald');
    });

    await user.click(categoryPlusButton!);

    expect(screen.getByPlaceholderText('Nome da categoria')).toBeInTheDocument();
    expect(screen.getByText('Criar Categoria')).toBeInTheDocument();
  });

  it('inline form shows icon selection grid', async () => {
    const user = userEvent.setup();
    render(<TransactionModal {...defaultProps} />);

    const plusButtons = screen.getAllByRole('button');
    const categoryPlusButton = plusButtons.find((btn) => {
      const svg = btn.querySelector('svg');
      return svg && btn.className.includes('emerald');
    });

    await user.click(categoryPlusButton!);

    // Check for icon label (looking for the text content, might be uppercase)
    const iconLabels = screen.queryAllByText(/ÍCONE|Ícone|ícone/i);
    expect(iconLabels.length).toBeGreaterThan(0);

    // Should have icon buttons (15 icons in grid)
    const inlineFormButtons = screen.getAllByRole('button').filter((btn) => {
      return btn.className.includes('aspect-square');
    });

    // Should have at least some icon buttons visible
    expect(inlineFormButtons.length).toBeGreaterThan(0);
  });

  it('inline form shows color selection grid', async () => {
    const user = userEvent.setup();
    render(<TransactionModal {...defaultProps} />);

    const plusButtons = screen.getAllByRole('button');
    const categoryPlusButton = plusButtons.find((btn) => {
      const svg = btn.querySelector('svg');
      return svg && btn.className.includes('emerald');
    });

    await user.click(categoryPlusButton!);

    expect(screen.getByText('Cor')).toBeInTheDocument();
  });

  it('can type category name in inline form', async () => {
    const user = userEvent.setup();
    render(<TransactionModal {...defaultProps} />);

    const plusButtons = screen.getAllByRole('button');
    const categoryPlusButton = plusButtons.find((btn) => {
      const svg = btn.querySelector('svg');
      return svg && btn.className.includes('emerald');
    });

    await user.click(categoryPlusButton!);

    const nameInput = screen.getByPlaceholderText('Nome da categoria');
    await user.type(nameInput, 'Nova Categoria');

    expect(nameInput).toHaveValue('Nova Categoria');
  });

  it('clicking plus button again closes inline form', async () => {
    const user = userEvent.setup();
    render(<TransactionModal {...defaultProps} />);

    const plusButtons = screen.getAllByRole('button');
    const categoryPlusButton = plusButtons.find((btn) => {
      const svg = btn.querySelector('svg');
      return svg && btn.className.includes('emerald');
    });

    await user.click(categoryPlusButton!);
    expect(screen.getByPlaceholderText('Nome da categoria')).toBeInTheDocument();

    await user.click(categoryPlusButton!);

    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Nome da categoria')).not.toBeInTheDocument();
    });
  });

  it('creates new category when form is submitted', async () => {
    const user = userEvent.setup();
    const mockDocId = 'new-cat-id';
    vi.mocked(DatabaseService.addDocument).mockResolvedValue(mockDocId);

    render(<TransactionModal {...defaultProps} />);

    const plusButtons = screen.getAllByRole('button');
    const categoryPlusButton = plusButtons.find((btn) => {
      const svg = btn.querySelector('svg');
      return svg && btn.className.includes('emerald');
    });

    await user.click(categoryPlusButton!);

    const nameInput = screen.getByPlaceholderText('Nome da categoria');
    await user.type(nameInput, 'Nova Categoria');

    const createButton = screen.getByText('Criar Categoria');
    await user.click(createButton);

    await waitFor(() => {
      expect(DatabaseService.addDocument).toHaveBeenCalled();
      const call = vi.mocked(DatabaseService.addDocument).mock.calls[0];
      expect(call[0]).toBe('categories');
      expect(call[1]).toMatchObject({
        name: 'Nova Categoria',
        userId: 'user1',
        type: 'expense',
      });
    });
  });

  it('disables category select while creating new category', async () => {
    const user = userEvent.setup();
    render(<TransactionModal {...defaultProps} />);

    const comboboxes = screen.getAllByRole('combobox');
    // Find the category select (should be the last combobox for expense type)
    const categorySelect = comboboxes[comboboxes.length - 1];
    expect(categorySelect).not.toBeDisabled();

    const plusButtons = screen.getAllByRole('button');
    const categoryPlusButton = plusButtons.find((btn) => {
      const svg = btn.querySelector('svg');
      return svg && btn.className.includes('emerald');
    });

    await user.click(categoryPlusButton!);

    expect(categorySelect).toBeDisabled();
  });

  it('create button is disabled when category name is empty', async () => {
    const user = userEvent.setup();
    render(<TransactionModal {...defaultProps} />);

    const plusButtons = screen.getAllByRole('button');
    const categoryPlusButton = plusButtons.find((btn) => {
      const svg = btn.querySelector('svg');
      return svg && btn.className.includes('emerald');
    });

    await user.click(categoryPlusButton!);

    const createButton = screen.getByText('Criar Categoria');
    expect(createButton).toBeDisabled();
  });

  it('does not show inline category creation for transfer type', async () => {
    render(<TransactionModal {...defaultProps} initialType="transfer" />);

    // Category section should not exist for transfers (no combobox for category)
    const comboboxes = screen.queryAllByRole('combobox');
    // Should have comboboxes for accounts but not for category
    // Check that there's no category-related plus button with emerald color
    const buttons = screen.getAllByRole('button');
    const categoryPlusButton = buttons.find((btn) => {
      return btn.className.includes('emerald-100');
    });

    expect(categoryPlusButton).toBeUndefined();
  });
});
