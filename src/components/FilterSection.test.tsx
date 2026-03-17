import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterSection } from './FilterSection';
import { Account, Category } from '../types';

describe('FilterSection', () => {
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
    { id: '1', name: 'Alimentação', color: '#ef4444', icon: 'UtensilsCrossed', type: 'expense', userId: 'user1' },
    { id: '2', name: 'Transporte', color: '#f59e0b', icon: 'Car', type: 'expense', userId: 'user1' },
  ];

  const mockSetFilterToday = vi.fn();
  const mockSetSelectedAccountId = vi.fn();
  const mockSetSelectedCategoryId = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders title correctly', () => {
    render(
      <FilterSection
        title="Transações"
        filterToday={false}
        setFilterToday={mockSetFilterToday}
        selectedAccountId="all"
        setSelectedAccountId={mockSetSelectedAccountId}
        selectedCategoryId="all"
        setSelectedCategoryId={mockSetSelectedCategoryId}
        accounts={mockAccounts}
        categories={mockCategories}
      />
    );

    expect(screen.getByText('Transações')).toBeInTheDocument();
  });

  it('toggles today filter when button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <FilterSection
        title="Transações"
        filterToday={false}
        setFilterToday={mockSetFilterToday}
        selectedAccountId="all"
        setSelectedAccountId={mockSetSelectedAccountId}
        selectedCategoryId="all"
        setSelectedCategoryId={mockSetSelectedCategoryId}
        accounts={mockAccounts}
        categories={mockCategories}
      />
    );

    await user.click(screen.getByText('Hoje'));

    expect(mockSetFilterToday).toHaveBeenCalledWith(true);
  });

  it('renders all accounts in select', () => {
    render(
      <FilterSection
        title="Transações"
        filterToday={false}
        setFilterToday={mockSetFilterToday}
        selectedAccountId="all"
        setSelectedAccountId={mockSetSelectedAccountId}
        selectedCategoryId="all"
        setSelectedCategoryId={mockSetSelectedCategoryId}
        accounts={mockAccounts}
        categories={mockCategories}
      />
    );

    expect(screen.getByText('Todas Contas')).toBeInTheDocument();
    expect(screen.getByText('Conta Corrente')).toBeInTheDocument();
    expect(screen.getByText('Poupança')).toBeInTheDocument();
  });

  it('renders all categories in select', () => {
    render(
      <FilterSection
        title="Transações"
        filterToday={false}
        setFilterToday={mockSetFilterToday}
        selectedAccountId="all"
        setSelectedAccountId={mockSetSelectedAccountId}
        selectedCategoryId="all"
        setSelectedCategoryId={mockSetSelectedCategoryId}
        accounts={mockAccounts}
        categories={mockCategories}
      />
    );

    expect(screen.getByText('Todas Categorias')).toBeInTheDocument();
    expect(screen.getByText('Alimentação')).toBeInTheDocument();
    expect(screen.getByText('Transporte')).toBeInTheDocument();
  });

  it('shows clear button when filters are active', () => {
    render(
      <FilterSection
        title="Transações"
        filterToday={true}
        setFilterToday={mockSetFilterToday}
        selectedAccountId="all"
        setSelectedAccountId={mockSetSelectedAccountId}
        selectedCategoryId="all"
        setSelectedCategoryId={mockSetSelectedCategoryId}
        accounts={mockAccounts}
        categories={mockCategories}
      />
    );

    expect(screen.getByText('Limpar')).toBeInTheDocument();
  });

  it('clears all filters when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <FilterSection
        title="Transações"
        filterToday={true}
        setFilterToday={mockSetFilterToday}
        selectedAccountId="1"
        setSelectedAccountId={mockSetSelectedAccountId}
        selectedCategoryId="1"
        setSelectedCategoryId={mockSetSelectedCategoryId}
        accounts={mockAccounts}
        categories={mockCategories}
      />
    );

    await user.click(screen.getByText('Limpar'));

    expect(mockSetSelectedAccountId).toHaveBeenCalledWith('all');
    expect(mockSetSelectedCategoryId).toHaveBeenCalledWith('all');
    expect(mockSetFilterToday).toHaveBeenCalledWith(false);
  });

  it('changes account selection', async () => {
    const user = userEvent.setup();
    render(
      <FilterSection
        title="Transações"
        filterToday={false}
        setFilterToday={mockSetFilterToday}
        selectedAccountId="all"
        setSelectedAccountId={mockSetSelectedAccountId}
        selectedCategoryId="all"
        setSelectedCategoryId={mockSetSelectedCategoryId}
        accounts={mockAccounts}
        categories={mockCategories}
      />
    );

    const accountSelect = screen.getAllByRole('combobox')[0];
    await user.selectOptions(accountSelect, '1');

    expect(mockSetSelectedAccountId).toHaveBeenCalledWith('1');
  });

  it('changes category selection', async () => {
    const user = userEvent.setup();
    render(
      <FilterSection
        title="Transações"
        filterToday={false}
        setFilterToday={mockSetFilterToday}
        selectedAccountId="all"
        setSelectedAccountId={mockSetSelectedAccountId}
        selectedCategoryId="all"
        setSelectedCategoryId={mockSetSelectedCategoryId}
        accounts={mockAccounts}
        categories={mockCategories}
      />
    );

    const categorySelect = screen.getAllByRole('combobox')[1];
    await user.selectOptions(categorySelect, '1');

    expect(mockSetSelectedCategoryId).toHaveBeenCalledWith('1');
  });
});
