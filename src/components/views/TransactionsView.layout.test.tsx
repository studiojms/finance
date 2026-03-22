import { render } from '@testing-library/react';
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
});
