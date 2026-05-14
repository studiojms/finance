import { render, screen } from '@testing-library/react';
import { TransactionsView } from './TransactionsView';
import { Account, Transaction, Category } from '../../types';

describe('TransactionsView Layout', () => {
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
      id: '1',
      name: 'Alimentação',
      icon: 'Utensils',
      color: '#ef4444',
      type: 'expense',
      userId: 'user1',
    },
  ];

  const mockTransactions: Transaction[] = [
    {
      id: 'tx1',
      description: 'Supermercado',
      amount: 150,
      date: '2026-03-15T12:00:00.000Z',
      accountId: '1',
      categoryId: '1',
      type: 'expense',
      isConsolidated: true,
      userId: 'user1',
    },
  ];

  const mockTransactionsByDay = [
    {
      date: '2026-03-15T12:00:00.000Z',
      transactions: mockTransactions,
      dayTotal: -150,
      runningBalance: 850,
    },
  ];

  const mockSetSelectedAccountIds = vi.fn();
  const mockSetSelectedCategoryIds = vi.fn();
  const mockSetFilterToday = vi.fn();
  const mockOnToggleConsolidated = vi.fn();
  const mockOnEditTransaction = vi.fn();
  const mockOnDeleteTransaction = vi.fn();

  it('does not have extra bottom padding that would conflict with App padding', () => {
    const { container } = render(
      <TransactionsView
        transactionsByDay={mockTransactionsByDay}
        categories={mockCategories}
        accounts={mockAccounts}
        selectedAccountIds={[]}
        setSelectedAccountIds={mockSetSelectedAccountIds}
        selectedCategoryIds={[]}
        setSelectedCategoryIds={mockSetSelectedCategoryIds}
        filterToday={false}
        setFilterToday={mockSetFilterToday}
        onToggleConsolidated={mockOnToggleConsolidated}
        onEditTransaction={mockOnEditTransaction}
        onDeleteTransaction={mockOnDeleteTransaction}
      />
    );

    const contentDiv = container.querySelector('.space-y-6');
    expect(contentDiv).not.toHaveClass('pb-20');
  });

  it('renders with proper spacing between transaction groups', () => {
    const { container } = render(
      <TransactionsView
        transactionsByDay={mockTransactionsByDay}
        categories={mockCategories}
        accounts={mockAccounts}
        selectedAccountIds={[]}
        setSelectedAccountIds={mockSetSelectedAccountIds}
        selectedCategoryIds={[]}
        setSelectedCategoryIds={mockSetSelectedCategoryIds}
        filterToday={false}
        setFilterToday={mockSetFilterToday}
        onToggleConsolidated={mockOnToggleConsolidated}
        onEditTransaction={mockOnEditTransaction}
        onDeleteTransaction={mockOnDeleteTransaction}
      />
    );

    const contentDiv = container.querySelector('.space-y-6');
    expect(contentDiv).toHaveClass('space-y-6');
  });

  it('displays date with day of week', () => {
    render(
      <TransactionsView
        transactionsByDay={mockTransactionsByDay}
        categories={mockCategories}
        accounts={mockAccounts}
        selectedAccountIds={[]}
        setSelectedAccountIds={mockSetSelectedAccountIds}
        selectedCategoryIds={[]}
        setSelectedCategoryIds={mockSetSelectedCategoryIds}
        filterToday={false}
        setFilterToday={mockSetFilterToday}
        onToggleConsolidated={mockOnToggleConsolidated}
        onEditTransaction={mockOnEditTransaction}
        onDeleteTransaction={mockOnDeleteTransaction}
      />
    );

    expect(screen.getByText(/15 DE MARÇO - Domingo/i)).toBeInTheDocument();
  });

  it('groups transactions by date regardless of time', () => {
    const transactionsWithDifferentTimes: Transaction[] = [
      {
        id: 'tx1',
        description: 'Morning Transaction',
        amount: 100,
        date: '2026-03-15T08:00:00.000Z',
        accountId: '1',
        categoryId: '1',
        type: 'expense',
        isConsolidated: true,
        userId: 'user1',
      },
      {
        id: 'tx2',
        description: 'Afternoon Transaction',
        amount: 50,
        date: '2026-03-15T15:30:00.000Z',
        accountId: '1',
        categoryId: '1',
        type: 'expense',
        isConsolidated: true,
        userId: 'user1',
      },
    ];

    const groupedByDay = [
      {
        date: '2026-03-15',
        transactions: transactionsWithDifferentTimes,
        dayTotal: -150,
        runningBalance: 850,
      },
    ];

    render(
      <TransactionsView
        transactionsByDay={groupedByDay}
        categories={mockCategories}
        accounts={mockAccounts}
        selectedAccountIds={[]}
        setSelectedAccountIds={mockSetSelectedAccountIds}
        selectedCategoryIds={[]}
        setSelectedCategoryIds={mockSetSelectedCategoryIds}
        filterToday={false}
        setFilterToday={mockSetFilterToday}
        onToggleConsolidated={mockOnToggleConsolidated}
        onEditTransaction={mockOnEditTransaction}
        onDeleteTransaction={mockOnDeleteTransaction}
      />
    );

    const dateHeaders = screen.getAllByText(/15 DE MARÇO/i);
    expect(dateHeaders).toHaveLength(1);
    expect(screen.getByText('Morning Transaction')).toBeInTheDocument();
    expect(screen.getByText('Afternoon Transaction')).toBeInTheDocument();
  });

  it('displays empty state when no transactions', () => {
    render(
      <TransactionsView
        transactionsByDay={[]}
        categories={mockCategories}
        accounts={mockAccounts}
        selectedAccountIds={[]}
        setSelectedAccountIds={mockSetSelectedAccountIds}
        selectedCategoryIds={[]}
        setSelectedCategoryIds={mockSetSelectedCategoryIds}
        filterToday={false}
        setFilterToday={mockSetFilterToday}
        onToggleConsolidated={mockOnToggleConsolidated}
        onEditTransaction={mockOnEditTransaction}
        onDeleteTransaction={mockOnDeleteTransaction}
      />
    );

    expect(screen.getByText('Nenhum lançamento encontrado.')).toBeInTheDocument();
  });
});
