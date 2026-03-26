import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChartsView } from './ChartsView';
import { Account, Transaction, Category } from '../../types';

describe('ChartsView', () => {
  const mockCategories: Category[] = [
    {
      id: 'cat1',
      name: 'Alimentação',
      icon: 'Utensils',
      color: '#ef4444',
      type: 'expense',
      userId: 'user1',
    },
    {
      id: 'cat2',
      name: 'Transporte',
      icon: 'Car',
      color: '#3b82f6',
      type: 'expense',
      userId: 'user1',
    },
    {
      id: 'cat3',
      name: 'Salário',
      icon: 'Briefcase',
      color: '#10b981',
      type: 'income',
      userId: 'user1',
    },
  ];

  const mockAccounts: Account[] = [
    {
      id: 'acc1',
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

  const mockTransactions: Transaction[] = [
    {
      id: 'tx1',
      description: 'Supermercado',
      amount: 150,
      date: '2026-03-15T12:00:00.000Z',
      accountId: 'acc1',
      categoryId: 'cat1',
      type: 'expense',
      isConsolidated: true,
      userId: 'user1',
    },
    {
      id: 'tx2',
      description: 'Uber',
      amount: 50,
      date: '2026-03-16T12:00:00.000Z',
      accountId: 'acc1',
      categoryId: 'cat2',
      type: 'expense',
      isConsolidated: true,
      userId: 'user1',
    },
    {
      id: 'tx3',
      description: 'Pagamento',
      amount: 5000,
      date: '2026-03-01T12:00:00.000Z',
      accountId: 'acc1',
      categoryId: 'cat3',
      type: 'income',
      isConsolidated: true,
      userId: 'user1',
    },
  ];

  const mockGetPieData = (transactions: Transaction[], categories: Category[]) => {
    const data: Record<string, { value: number; color: string }> = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const cat = categories.find((c) => c.id === t.categoryId);
        const name = cat?.name || 'Outros';
        if (!data[name]) {
          data[name] = { value: 0, color: cat?.color || '#cbd5e1' };
        }
        data[name].value += t.amount;
      });
    return Object.entries(data).map(([name, info]) => ({ name, ...info }));
  };

  const mockSetSelectedAccountIds = vi.fn();
  const mockSetSelectedCategoryIds = vi.fn();
  const mockSetFilterToday = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders title', () => {
    render(
      <ChartsView
        filteredTransactions={mockTransactions}
        categories={mockCategories}
        accounts={mockAccounts}
        selectedAccountIds={[]}
        setSelectedAccountIds={mockSetSelectedAccountIds}
        selectedCategoryIds={[]}
        setSelectedCategoryIds={mockSetSelectedCategoryIds}
        filterToday={false}
        setFilterToday={mockSetFilterToday}
        getPieData={mockGetPieData}
      />
    );

    expect(screen.getByText('Análise Mensal')).toBeInTheDocument();
  });

  it('renders chart section header', () => {
    render(
      <ChartsView
        filteredTransactions={mockTransactions}
        categories={mockCategories}
        accounts={mockAccounts}
        selectedAccountIds={[]}
        setSelectedAccountIds={mockSetSelectedAccountIds}
        selectedCategoryIds={[]}
        setSelectedCategoryIds={mockSetSelectedCategoryIds}
        filterToday={false}
        setFilterToday={mockSetFilterToday}
        getPieData={mockGetPieData}
      />
    );

    expect(screen.getByText('Despesas por Categoria')).toBeInTheDocument();
  });

  it('displays pie chart legend with category names', () => {
    const { container } = render(
      <ChartsView
        filteredTransactions={mockTransactions}
        categories={mockCategories}
        accounts={mockAccounts}
        selectedAccountIds={[]}
        setSelectedAccountIds={mockSetSelectedAccountIds}
        selectedCategoryIds={[]}
        setSelectedCategoryIds={mockSetSelectedCategoryIds}
        filterToday={false}
        setFilterToday={mockSetFilterToday}
        getPieData={mockGetPieData}
      />
    );

    const chartLegend = container.querySelector('.mt-4.space-y-2');
    expect(chartLegend?.textContent).toContain('Alimentação');
    expect(chartLegend?.textContent).toContain('Transporte');
  });

  it('displays category values in currency format', () => {
    render(
      <ChartsView
        filteredTransactions={mockTransactions}
        categories={mockCategories}
        accounts={mockAccounts}
        selectedAccountIds={[]}
        setSelectedAccountIds={mockSetSelectedAccountIds}
        selectedCategoryIds={[]}
        setSelectedCategoryIds={mockSetSelectedCategoryIds}
        filterToday={false}
        setFilterToday={mockSetFilterToday}
        getPieData={mockGetPieData}
      />
    );

    expect(screen.getByText('R$ 150,00')).toBeInTheDocument();
    expect(screen.getByText('R$ 50,00')).toBeInTheDocument();
  });

  it('uses category colors in legend', () => {
    const { container } = render(
      <ChartsView
        filteredTransactions={mockTransactions}
        categories={mockCategories}
        accounts={mockAccounts}
        selectedAccountIds={[]}
        setSelectedAccountIds={mockSetSelectedAccountIds}
        selectedCategoryIds={[]}
        setSelectedCategoryIds={mockSetSelectedCategoryIds}
        filterToday={false}
        setFilterToday={mockSetFilterToday}
        getPieData={mockGetPieData}
      />
    );

    const colorDots = container.querySelectorAll('.w-3.h-3.rounded-full');
    expect(colorDots.length).toBeGreaterThan(0);

    const alimentacaoDot = Array.from(colorDots).find((dot) =>
      (dot as HTMLElement).style.backgroundColor.includes('rgb(239, 68, 68)')
    );
    expect(alimentacaoDot).toBeTruthy();
  });

  it('shows empty state when no expense transactions', () => {
    const incomeOnlyTransactions = mockTransactions.filter((t) => t.type === 'income');

    render(
      <ChartsView
        filteredTransactions={incomeOnlyTransactions}
        categories={mockCategories}
        accounts={mockAccounts}
        selectedAccountIds={[]}
        setSelectedAccountIds={mockSetSelectedAccountIds}
        selectedCategoryIds={[]}
        setSelectedCategoryIds={mockSetSelectedCategoryIds}
        filterToday={false}
        setFilterToday={mockSetFilterToday}
        getPieData={mockGetPieData}
      />
    );

    expect(screen.getByText('Nenhum dado para os filtros selecionados.')).toBeInTheDocument();
  });

  it('filters transactions by account', async () => {
    const user = userEvent.setup();
    render(
      <ChartsView
        filteredTransactions={mockTransactions}
        categories={mockCategories}
        accounts={mockAccounts}
        selectedAccountIds={[]}
        setSelectedAccountIds={mockSetSelectedAccountIds}
        selectedCategoryIds={[]}
        setSelectedCategoryIds={mockSetSelectedCategoryIds}
        filterToday={false}
        setFilterToday={mockSetFilterToday}
        getPieData={mockGetPieData}
      />
    );

    const accountDropdown = screen.getByText('Todas Contas');
    await user.click(accountDropdown);
    const accountOption = screen.getByText('Conta Corrente');
    await user.click(accountOption);

    expect(mockSetSelectedAccountIds).toHaveBeenCalledWith(['acc1']);
  });

  it('filters transactions by category', async () => {
    const user = userEvent.setup();
    render(
      <ChartsView
        filteredTransactions={mockTransactions}
        categories={mockCategories}
        accounts={mockAccounts}
        selectedAccountIds={[]}
        setSelectedAccountIds={mockSetSelectedAccountIds}
        selectedCategoryIds={[]}
        setSelectedCategoryIds={mockSetSelectedCategoryIds}
        filterToday={false}
        setFilterToday={mockSetFilterToday}
        getPieData={mockGetPieData}
      />
    );

    const categoryDropdown = screen.getByText('Todas Categorias');
    await user.click(categoryDropdown);

    const categoryButtons = screen.getAllByRole('button');
    const alimentacaoButton = categoryButtons.find(
      (btn) => btn.textContent?.includes('Alimentação') && btn.className.includes('w-full')
    );
    expect(alimentacaoButton).toBeTruthy();
    await user.click(alimentacaoButton!);

    expect(mockSetSelectedCategoryIds).toHaveBeenCalledWith(['cat1']);
  });

  it('toggles today filter', async () => {
    const user = userEvent.setup();
    render(
      <ChartsView
        filteredTransactions={mockTransactions}
        categories={mockCategories}
        accounts={mockAccounts}
        selectedAccountIds={[]}
        setSelectedAccountIds={mockSetSelectedAccountIds}
        selectedCategoryIds={[]}
        setSelectedCategoryIds={mockSetSelectedCategoryIds}
        filterToday={false}
        setFilterToday={mockSetFilterToday}
        getPieData={mockGetPieData}
      />
    );

    const todayButton = screen.getByText('Hoje');
    await user.click(todayButton);

    expect(mockSetFilterToday).toHaveBeenCalledWith(true);
  });

  it('only shows expense transactions in pie chart', () => {
    const { container } = render(
      <ChartsView
        filteredTransactions={mockTransactions}
        categories={mockCategories}
        accounts={mockAccounts}
        selectedAccountIds={[]}
        setSelectedAccountIds={mockSetSelectedAccountIds}
        selectedCategoryIds={[]}
        setSelectedCategoryIds={mockSetSelectedCategoryIds}
        filterToday={false}
        setFilterToday={mockSetFilterToday}
        getPieData={mockGetPieData}
      />
    );

    const chartLegend = container.querySelector('.mt-4.space-y-2');
    expect(chartLegend).toBeTruthy();
    expect(chartLegend?.textContent).toContain('Alimentação');
    expect(chartLegend?.textContent).toContain('Transporte');
    expect(chartLegend?.textContent).not.toContain('Salário');
  });

  it('aggregates multiple transactions from same category', () => {
    const transactionsWithDuplicates = [
      ...mockTransactions,
      {
        id: 'tx4',
        description: 'Restaurante',
        amount: 100,
        date: '2026-03-17T12:00:00.000Z',
        accountId: 'acc1',
        categoryId: 'cat1',
        type: 'expense' as const,
        isConsolidated: true,
        userId: 'user1',
      },
    ];

    render(
      <ChartsView
        filteredTransactions={transactionsWithDuplicates}
        categories={mockCategories}
        accounts={mockAccounts}
        selectedAccountIds={[]}
        setSelectedAccountIds={mockSetSelectedAccountIds}
        selectedCategoryIds={[]}
        setSelectedCategoryIds={mockSetSelectedCategoryIds}
        filterToday={false}
        setFilterToday={mockSetFilterToday}
        getPieData={mockGetPieData}
      />
    );

    expect(screen.getAllByText(/R\$ 250,00/)).toHaveLength(1);
  });
});
