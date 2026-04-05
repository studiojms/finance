import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransactionModal } from './TransactionModal';
import { Account, Category, Transaction } from '../../types';

vi.mock('firebase/firestore', () => ({
  addDoc: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  updateDoc: vi.fn(),
  writeBatch: vi.fn(() => ({
    update: vi.fn(),
    set: vi.fn(),
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

describe('TransactionModal - Mobile Responsive Layout', () => {
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
    {
      id: '2',
      name: 'Poupança',
      type: 'savings',
      balance: 5000,
      initialBalance: 5000,
      initialBalanceDate: '2026-01-01',
      color: '#3b82f6',
      icon: 'PiggyBank',
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

  it('date and account fields container has mobile-responsive grid classes', () => {
    render(<TransactionModal {...defaultProps} />);

    const dateLabel = screen.getByText('Data');
    const dateContainer = dateLabel.closest('div')?.parentElement;

    expect(dateContainer?.className).toContain('grid');
    expect(dateContainer?.className).toContain('grid-cols-1');
    expect(dateContainer?.className).toContain('md:grid-cols-2');
  });

  it('date and account fields container uses single column for transfer type', () => {
    render(<TransactionModal {...defaultProps} initialType="transfer" />);

    const dateLabel = screen.getByText('Data');
    const dateContainer = dateLabel.closest('div')?.parentElement;

    expect(dateContainer?.className).toContain('grid-cols-1');
    expect(dateContainer?.className).not.toContain('md:grid-cols-2');
  });

  it('installment fields container has mobile-responsive grid classes when expanded', async () => {
    const user = userEvent.setup();
    render(<TransactionModal {...defaultProps} />);

    const expandButton = screen.getByText('Opções de Parcelamento');
    await user.click(expandButton);

    const installmentsLabel = screen.getByText('Parcelas');
    const installmentsContainer = installmentsLabel.closest('div')?.parentElement;

    expect(installmentsContainer?.className).toContain('grid');
    expect(installmentsContainer?.className).toContain('grid-cols-1');
    expect(installmentsContainer?.className).toContain('md:grid-cols-2');
  });
});

describe('TransactionModal - Installment Total Calculation', () => {
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
      name: 'Compras',
      icon: 'ShoppingBag',
      color: '#f59e0b',
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

  it('does not show total calculation when installments section is not expanded', () => {
    render(<TransactionModal {...defaultProps} />);

    expect(screen.queryByText('Valor Total')).not.toBeInTheDocument();
  });

  it('does not show total calculation when installments is 1', async () => {
    const user = userEvent.setup();
    render(<TransactionModal {...defaultProps} />);

    const expandButton = screen.getByText('Opções de Parcelamento');
    await user.click(expandButton);

    const installmentsInput = screen.getByLabelText('Parcelas');
    expect(installmentsInput).toHaveValue(1);

    expect(screen.queryByText('Valor Total')).not.toBeInTheDocument();
  });

  it('shows total calculation when installments is greater than 1', async () => {
    const user = userEvent.setup();
    render(<TransactionModal {...defaultProps} />);

    const expandButton = screen.getByText('Opções de Parcelamento');
    await user.click(expandButton);

    const installmentsInput = screen.getByLabelText('Parcelas');
    await user.clear(installmentsInput);
    await user.type(installmentsInput, '3');

    expect(screen.getByText('Valor Total')).toBeInTheDocument();
  });

  it('calculates total value correctly for multiple installments', async () => {
    const user = userEvent.setup();
    render(<TransactionModal {...defaultProps} />);

    const amountInput = screen.getByLabelText('Valor');
    await user.clear(amountInput);
    await user.type(amountInput, '15000');

    const expandButton = screen.getByText('Opções de Parcelamento');
    await user.click(expandButton);

    const installmentsInput = screen.getByLabelText('Parcelas');
    await user.clear(installmentsInput);
    await user.type(installmentsInput, '6');

    expect(screen.getByText('Valor Total')).toBeInTheDocument();
    expect(screen.getByText('R$ 900,00')).toBeInTheDocument();
    expect(screen.getByText(/6 × R\$ 150,00/)).toBeInTheDocument();
  });

  it('updates total calculation when amount changes', async () => {
    const user = userEvent.setup();
    render(<TransactionModal {...defaultProps} />);

    const expandButton = screen.getByText('Opções de Parcelamento');
    await user.click(expandButton);

    const installmentsInput = screen.getByLabelText('Parcelas');
    await user.clear(installmentsInput);
    await user.type(installmentsInput, '4');

    const amountInput = screen.getByLabelText('Valor');
    await user.clear(amountInput);
    await user.type(amountInput, '10000');

    expect(screen.getByText('R$ 400,00')).toBeInTheDocument();
    expect(screen.getByText(/4 × R\$ 100,00/)).toBeInTheDocument();
  });

  it('updates total calculation when installments change', async () => {
    const user = userEvent.setup();
    render(<TransactionModal {...defaultProps} />);

    const amountInput = screen.getByLabelText('Valor');
    await user.clear(amountInput);
    await user.type(amountInput, '20000');

    const expandButton = screen.getByText('Opções de Parcelamento');
    await user.click(expandButton);

    const installmentsInput = screen.getByLabelText('Parcelas');
    await user.clear(installmentsInput);
    await user.type(installmentsInput, '5');

    expect(screen.getByText('R$ 1.000,00')).toBeInTheDocument();

    await user.clear(installmentsInput);
    await user.type(installmentsInput, '10');

    expect(screen.getByText('R$ 2.000,00')).toBeInTheDocument();
    expect(screen.getByText(/10 × R\$ 200,00/)).toBeInTheDocument();
  });

  it('does not show total calculation when infinite installments is checked', async () => {
    const user = userEvent.setup();
    render(<TransactionModal {...defaultProps} />);

    const amountInput = screen.getByLabelText('Valor');
    await user.clear(amountInput);
    await user.type(amountInput, '15000');

    const expandButton = screen.getByText('Opções de Parcelamento');
    await user.click(expandButton);

    const installmentsInput = screen.getByLabelText('Parcelas');
    await user.clear(installmentsInput);
    await user.type(installmentsInput, '6');

    expect(screen.getByText('Valor Total')).toBeInTheDocument();

    const infiniteCheckbox = screen.getByRole('checkbox', { name: /Parcelamento Indefinido/i });
    await user.click(infiniteCheckbox);

    expect(screen.queryByText('Valor Total')).not.toBeInTheDocument();
  });

  it('shows total calculation for transfer type with recurrence', async () => {
    const user = userEvent.setup();
    render(<TransactionModal {...defaultProps} initialType="transfer" />);

    const amountInput = screen.getByLabelText('Valor');
    await user.clear(amountInput);
    await user.type(amountInput, '30000');

    const expandButton = screen.getByText('Opções de Recorrência');
    await user.click(expandButton);

    const repetitionsInput = screen.getByLabelText('Repetições');
    await user.clear(repetitionsInput);
    await user.type(repetitionsInput, '12');

    expect(screen.getByText('Valor Total')).toBeInTheDocument();
    expect(screen.getByText('R$ 3.600,00')).toBeInTheDocument();
    expect(screen.getByText(/12 × R\$ 300,00/)).toBeInTheDocument();
  });
});
