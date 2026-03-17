import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransactionItem } from './TransactionItem';
import { Transaction, Category, Account } from '../types';

describe('TransactionItem', () => {
  const mockAccount: Account = {
    id: '1',
    name: 'Conta Corrente',
    type: 'checking',
    balance: 1000,
    initialBalance: 1000,
    initialBalanceDate: '2026-01-01',
    color: '#10b981',
    icon: 'Banknote',
    userId: 'user1',
  };

  const mockCategory: Category = {
    id: '1',
    name: 'Alimentação',
    color: '#ef4444',
    icon: 'UtensilsCrossed',
    type: 'expense',
    userId: 'user1',
  };

  const mockTransaction: Transaction = {
    id: '1',
    description: 'Supermercado',
    amount: 150.5,
    date: '2026-03-15T12:00:00.000Z',
    accountId: '1',
    categoryId: '1',
    type: 'expense',
    isConsolidated: false,
    userId: 'user1',
  };

  const mockOnToggle = vi.fn();
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders transaction description', () => {
    render(
      <TransactionItem
        transaction={mockTransaction}
        category={mockCategory}
        account={mockAccount}
        onToggle={mockOnToggle}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Supermercado')).toBeInTheDocument();
  });

  it('renders transaction amount for expense', () => {
    render(
      <TransactionItem
        transaction={mockTransaction}
        category={mockCategory}
        account={mockAccount}
        onToggle={mockOnToggle}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('-R$ 150,50')).toBeInTheDocument();
  });

  it('renders transaction amount for income', () => {
    const incomeTransaction = { ...mockTransaction, type: 'income' as const };
    render(
      <TransactionItem
        transaction={incomeTransaction}
        category={mockCategory}
        account={mockAccount}
        onToggle={mockOnToggle}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('R$ 150,50')).toBeInTheDocument();
  });

  it('renders account name', () => {
    render(
      <TransactionItem
        transaction={mockTransaction}
        category={mockCategory}
        account={mockAccount}
        onToggle={mockOnToggle}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const accountName = screen.getAllByText('Conta Corrente');
    expect(accountName.length).toBeGreaterThan(0);
  });

  it('renders category name', () => {
    render(
      <TransactionItem
        transaction={mockTransaction}
        category={mockCategory}
        account={mockAccount}
        onToggle={mockOnToggle}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Alimentação')).toBeInTheDocument();
  });

  it('shows consolidated status for consolidated transaction', () => {
    const consolidatedTransaction = { ...mockTransaction, isConsolidated: true };
    const { container } = render(
      <TransactionItem
        transaction={consolidatedTransaction}
        category={mockCategory}
        account={mockAccount}
        onToggle={mockOnToggle}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const checkButton = container.querySelector('.bg-emerald-100');
    expect(checkButton).toBeInTheDocument();
  });

  it('calls onToggle when toggle button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TransactionItem
        transaction={mockTransaction}
        category={mockCategory}
        account={mockAccount}
        onToggle={mockOnToggle}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const toggleButton = screen.getAllByRole('button')[0];
    await user.click(toggleButton);

    expect(mockOnToggle).toHaveBeenCalledTimes(1);
  });

  it('calls onEdit when transaction item is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <TransactionItem
        transaction={mockTransaction}
        category={mockCategory}
        account={mockAccount}
        onToggle={mockOnToggle}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const transactionDiv = container.querySelector('.bg-white');
    if (transactionDiv) {
      await user.click(transactionDiv);
      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    }
  });

  it('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TransactionItem
        transaction={mockTransaction}
        category={mockCategory}
        account={mockAccount}
        onToggle={mockOnToggle}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = screen.getAllByRole('button')[1];
    await user.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });

  it('displays installment information when present', () => {
    const installmentTransaction = {
      ...mockTransaction,
      installmentId: 'inst-1',
      installmentNumber: 2,
      totalInstallments: 5,
    };
    render(
      <TransactionItem
        transaction={installmentTransaction}
        category={mockCategory}
        account={mockAccount}
        onToggle={mockOnToggle}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('2/5')).toBeInTheDocument();
  });

  it('displays "Transferência" for transfer type', () => {
    const transferTransaction = { ...mockTransaction, type: 'transfer' as const };
    render(
      <TransactionItem
        transaction={transferTransaction}
        category={mockCategory}
        account={mockAccount}
        onToggle={mockOnToggle}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Transferência')).toBeInTheDocument();
  });
});
