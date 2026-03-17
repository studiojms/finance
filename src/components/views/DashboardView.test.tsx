import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardView } from './DashboardView';
import { Account, Transaction, Category } from '../../types';

describe('DashboardView', () => {
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
    { id: '1', name: 'Alimentação', color: '#ef4444', icon: 'UtensilsCrossed', type: 'expense', userId: 'user1' },
  ];

  const mockTransactions: Transaction[] = [
    {
      id: '1',
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

  const mockTotals = { income: 1000, expense: 500, balance: 500 };

  const defaultProps = {
    accounts: mockAccounts,
    transactions: mockTransactions,
    categories: mockCategories,
    filteredTransactions: mockTransactions,
    upcomingTransactions: [],
    totals: mockTotals,
    totalBalance: 1000,
    selectedAccountId: 'all' as const,
    setSelectedAccountId: vi.fn(),
    selectedCategoryId: 'all' as const,
    setSelectedCategoryId: vi.fn(),
    filterToday: false,
    setFilterToday: vi.fn(),
    onToggleConsolidated: vi.fn(),
    onEditTransaction: vi.fn(),
    onDeleteTransaction: vi.fn(),
    setActiveTab: vi.fn(),
  };

  it('renders dashboard title', () => {
    render(<DashboardView {...defaultProps} />);

    expect(screen.getByText('Visão Geral')).toBeInTheDocument();
  });

  it('displays income and expense totals', () => {
    render(<DashboardView {...defaultProps} />);

    const amounts = screen.getAllByText('R$ 1.000,00');
    expect(amounts.length).toBeGreaterThan(0);
    expect(screen.getByText('R$ 500,00')).toBeInTheDocument();
  });

  it('renders account cards', () => {
    render(<DashboardView {...defaultProps} />);

    const accountName = screen.getAllByText('Conta Corrente')[1];
    expect(accountName).toBeInTheDocument();
  });

  it('shows recent transactions', () => {
    render(<DashboardView {...defaultProps} />);

    expect(screen.getByText('Lançamentos Recentes')).toBeInTheDocument();
    expect(screen.getByText('Supermercado')).toBeInTheDocument();
  });

  it('shows empty state when no transactions', () => {
    render(<DashboardView {...defaultProps} filteredTransactions={[]} />);

    expect(screen.getByText('Nenhum lançamento encontrado.')).toBeInTheDocument();
  });

  it('navigates to accounts view when "Ver todas" is clicked', async () => {
    const user = userEvent.setup();
    render(<DashboardView {...defaultProps} />);

    await user.click(screen.getByText('Ver todas'));

    expect(defaultProps.setActiveTab).toHaveBeenCalledWith('accounts');
  });

  it('navigates to transactions view when "Ver extrato" is clicked', async () => {
    const user = userEvent.setup();
    render(<DashboardView {...defaultProps} />);

    await user.click(screen.getByText('Ver extrato'));

    expect(defaultProps.setActiveTab).toHaveBeenCalledWith('transactions');
  });

  it('shows upcoming transactions section', () => {
    render(<DashboardView {...defaultProps} />);

    expect(screen.getByText('Próximos Lançamentos')).toBeInTheDocument();
  });

  it('shows empty state for upcoming transactions when none exist', () => {
    render(<DashboardView {...defaultProps} />);

    expect(screen.getByText('Tudo em dia! Nenhum lançamento futuro.')).toBeInTheDocument();
  });

  it('displays add account button when no accounts exist', () => {
    render(<DashboardView {...defaultProps} accounts={[]} />);

    expect(screen.getByText('Nova Conta')).toBeInTheDocument();
  });
});
