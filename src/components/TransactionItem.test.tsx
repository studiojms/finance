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

  it('displays infinite installment information correctly', () => {
    const infiniteInstallmentTransaction = {
      ...mockTransaction,
      installmentId: 'inst-2',
      installmentNumber: 3,
      totalInstallments: null,
    };
    render(
      <TransactionItem
        transaction={infiniteInstallmentTransaction}
        category={mockCategory}
        account={mockAccount}
        onToggle={mockOnToggle}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('#3')).toBeInTheDocument();
  });

  it('displays "Transferência" for transfer type', () => {
    const transferTransaction = { ...mockTransaction, type: 'transfer' as const, categoryId: 'transfer' };
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

  describe('Visual styling based on transaction date', () => {
    it('applies overdue styling for unconsolidated transactions before today', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const overdueTransaction = {
        ...mockTransaction,
        date: yesterday.toISOString(),
        isConsolidated: false,
      };

      const { container } = render(
        <TransactionItem
          transaction={overdueTransaction}
          category={mockCategory}
          account={mockAccount}
          onToggle={mockOnToggle}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const transactionDiv = container.querySelector('.bg-yellow-50');
      expect(transactionDiv).toBeInTheDocument();
      expect(transactionDiv).toHaveClass('border-orange-200');

      const description = screen.getByText('Supermercado');
      expect(description).toHaveClass('font-black');
    });

    it('applies due today styling for unconsolidated transactions on today', () => {
      const today = new Date();
      const todayTransaction = {
        ...mockTransaction,
        date: today.toISOString(),
        isConsolidated: false,
      };

      render(
        <TransactionItem
          transaction={todayTransaction}
          category={mockCategory}
          account={mockAccount}
          onToggle={mockOnToggle}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const description = screen.getByText('Supermercado');
      expect(description).toHaveClass('font-black');
    });

    it('does not apply overdue styling for consolidated transactions', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const consolidatedTransaction = {
        ...mockTransaction,
        date: yesterday.toISOString(),
        isConsolidated: true,
      };

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

      const transactionDiv = container.querySelector('.bg-white');
      expect(transactionDiv).toBeInTheDocument();
      const yellowBgDiv = container.querySelector('.bg-yellow-50');
      expect(yellowBgDiv).not.toBeInTheDocument();
    });

    it('applies normal styling for future transactions', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const futureTransaction = {
        ...mockTransaction,
        date: tomorrow.toISOString(),
        isConsolidated: false,
      };

      const { container } = render(
        <TransactionItem
          transaction={futureTransaction}
          category={mockCategory}
          account={mockAccount}
          onToggle={mockOnToggle}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      const transactionDiv = container.querySelector('.bg-white');
      expect(transactionDiv).toBeInTheDocument();
      const description = screen.getByText('Supermercado');
      expect(description).toHaveClass('font-bold');
      expect(description).not.toHaveClass('font-black');
    });
  });
});
