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
  const mockSetSelectedAccountIds = vi.fn();
  const mockSetSelectedCategoryIds = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders title correctly', () => {
    render(
      <FilterSection
        title="Transações"
        filterToday={false}
        setFilterToday={mockSetFilterToday}
        selectedAccountIds={[]}
        setSelectedAccountIds={mockSetSelectedAccountIds}
        selectedCategoryIds={[]}
        setSelectedCategoryIds={mockSetSelectedCategoryIds}
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
        selectedAccountIds={[]}
        setSelectedAccountIds={mockSetSelectedAccountIds}
        selectedCategoryIds={[]}
        setSelectedCategoryIds={mockSetSelectedCategoryIds}
        accounts={mockAccounts}
        categories={mockCategories}
      />
    );

    await user.click(screen.getByText('Hoje'));

    expect(mockSetFilterToday).toHaveBeenCalledWith(true);
  });

  it('shows placeholder text when no accounts are selected', () => {
    render(
      <FilterSection
        title="Transações"
        filterToday={false}
        setFilterToday={mockSetFilterToday}
        selectedAccountIds={[]}
        setSelectedAccountIds={mockSetSelectedAccountIds}
        selectedCategoryIds={[]}
        setSelectedCategoryIds={mockSetSelectedCategoryIds}
        accounts={mockAccounts}
        categories={mockCategories}
      />
    );

    expect(screen.getByText('Todas Contas')).toBeInTheDocument();
  });

  it('shows count when accounts are selected', () => {
    render(
      <FilterSection
        title="Transações"
        filterToday={false}
        setFilterToday={mockSetFilterToday}
        selectedAccountIds={['1']}
        setSelectedAccountIds={mockSetSelectedAccountIds}
        selectedCategoryIds={[]}
        setSelectedCategoryIds={mockSetSelectedCategoryIds}
        accounts={mockAccounts}
        categories={mockCategories}
      />
    );

    expect(screen.getByText('1 selecionado')).toBeInTheDocument();
  });

  it('opens account dropdown and shows all accounts', async () => {
    const user = userEvent.setup();
    render(
      <FilterSection
        title="Transações"
        filterToday={false}
        setFilterToday={mockSetFilterToday}
        selectedAccountIds={[]}
        setSelectedAccountIds={mockSetSelectedAccountIds}
        selectedCategoryIds={[]}
        setSelectedCategoryIds={mockSetSelectedCategoryIds}
        accounts={mockAccounts}
        categories={mockCategories}
      />
    );

    await user.click(screen.getByText('Todas Contas'));

    expect(screen.getByText('Conta Corrente')).toBeVisible();
    expect(screen.getByText('Poupança')).toBeVisible();
  });

  it('selects an account when clicked', async () => {
    const user = userEvent.setup();
    render(
      <FilterSection
        title="Transações"
        filterToday={false}
        setFilterToday={mockSetFilterToday}
        selectedAccountIds={[]}
        setSelectedAccountIds={mockSetSelectedAccountIds}
        selectedCategoryIds={[]}
        setSelectedCategoryIds={mockSetSelectedCategoryIds}
        accounts={mockAccounts}
        categories={mockCategories}
      />
    );

    await user.click(screen.getByText('Todas Contas'));
    await user.click(screen.getByText('Conta Corrente'));

    expect(mockSetSelectedAccountIds).toHaveBeenCalledWith(['1']);
  });

  it('deselects an account when clicked again', async () => {
    const user = userEvent.setup();
    render(
      <FilterSection
        title="Transações"
        filterToday={false}
        setFilterToday={mockSetFilterToday}
        selectedAccountIds={['1']}
        setSelectedAccountIds={mockSetSelectedAccountIds}
        selectedCategoryIds={[]}
        setSelectedCategoryIds={mockSetSelectedCategoryIds}
        accounts={mockAccounts}
        categories={mockCategories}
      />
    );

    await user.click(screen.getByText('1 selecionado'));
    await user.click(screen.getByText('Conta Corrente'));

    expect(mockSetSelectedAccountIds).toHaveBeenCalledWith([]);
  });

  it('selects all accounts when "Todos" is clicked', async () => {
    const user = userEvent.setup();
    render(
      <FilterSection
        title="Transações"
        filterToday={false}
        setFilterToday={mockSetFilterToday}
        selectedAccountIds={[]}
        setSelectedAccountIds={mockSetSelectedAccountIds}
        selectedCategoryIds={[]}
        setSelectedCategoryIds={mockSetSelectedCategoryIds}
        accounts={mockAccounts}
        categories={mockCategories}
      />
    );

    await user.click(screen.getByText('Todas Contas'));
    await user.click(screen.getAllByText('Todos')[0]);

    expect(mockSetSelectedAccountIds).toHaveBeenCalledWith(['1', '2']);
  });

  it('clears all selections when "Limpar" in dropdown is clicked', async () => {
    const user = userEvent.setup();
    render(
      <FilterSection
        title="Transações"
        filterToday={false}
        setFilterToday={mockSetFilterToday}
        selectedAccountIds={['1']}
        setSelectedAccountIds={mockSetSelectedAccountIds}
        selectedCategoryIds={[]}
        setSelectedCategoryIds={mockSetSelectedCategoryIds}
        accounts={mockAccounts}
        categories={mockCategories}
      />
    );

    await user.click(screen.getByText('1 selecionado'));
    await user.click(screen.getAllByText('Limpar')[0]);

    expect(mockSetSelectedAccountIds).toHaveBeenCalledWith([]);
  });

  it('shows clear button when filters are active', () => {
    render(
      <FilterSection
        title="Transações"
        filterToday={false}
        setFilterToday={mockSetFilterToday}
        selectedAccountIds={['1']}
        setSelectedAccountIds={mockSetSelectedAccountIds}
        selectedCategoryIds={[]}
        setSelectedCategoryIds={mockSetSelectedCategoryIds}
        accounts={mockAccounts}
        categories={mockCategories}
      />
    );

    expect(screen.getAllByText('Limpar').length).toBeGreaterThan(0);
  });

  it('clears all filters when main clear button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <FilterSection
        title="Transações"
        filterToday={true}
        setFilterToday={mockSetFilterToday}
        selectedAccountIds={['1']}
        setSelectedAccountIds={mockSetSelectedAccountIds}
        selectedCategoryIds={['1']}
        setSelectedCategoryIds={mockSetSelectedCategoryIds}
        accounts={mockAccounts}
        categories={mockCategories}
      />
    );

    const clearButtons = screen.getAllByText('Limpar');
    await user.click(clearButtons[clearButtons.length - 1]);

    expect(mockSetSelectedAccountIds).toHaveBeenCalledWith([]);
    expect(mockSetSelectedCategoryIds).toHaveBeenCalledWith([]);
    expect(mockSetFilterToday).toHaveBeenCalledWith(false);
  });

  it('works with category selection', async () => {
    const user = userEvent.setup();
    render(
      <FilterSection
        title="Transações"
        filterToday={false}
        setFilterToday={mockSetFilterToday}
        selectedAccountIds={[]}
        setSelectedAccountIds={mockSetSelectedAccountIds}
        selectedCategoryIds={[]}
        setSelectedCategoryIds={mockSetSelectedCategoryIds}
        accounts={mockAccounts}
        categories={mockCategories}
      />
    );

    await user.click(screen.getByText('Todas Categorias'));
    await user.click(screen.getByText('Alimentação'));

    expect(mockSetSelectedCategoryIds).toHaveBeenCalledWith(['1']);
  });
});
