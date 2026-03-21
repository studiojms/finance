import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ManageView } from './ManageView';
import { Account, Category } from '../../types';

describe('ManageView', () => {
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

  const mockOnEditAccount = vi.fn();
  const mockOnDeleteAccount = vi.fn();
  const mockOnAddAccount = vi.fn();
  const mockOnEditCategory = vi.fn();
  const mockOnDeleteCategory = vi.fn();
  const mockOnAddCategory = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders with accounts tab active by default', () => {
    render(
      <ManageView
        accounts={mockAccounts}
        onEditAccount={mockOnEditAccount}
        onDeleteAccount={mockOnDeleteAccount}
        onAddAccount={mockOnAddAccount}
        categories={mockCategories}
        onEditCategory={mockOnEditCategory}
        onDeleteCategory={mockOnDeleteCategory}
        onAddCategory={mockOnAddCategory}
      />
    );

    expect(screen.getByText('Contas')).toHaveClass('bg-white');
    expect(screen.getByText('Minhas Contas')).toBeInTheDocument();
  });

  it('renders tab navigation', () => {
    render(
      <ManageView
        accounts={mockAccounts}
        onEditAccount={mockOnEditAccount}
        onDeleteAccount={mockOnDeleteAccount}
        onAddAccount={mockOnAddAccount}
        categories={mockCategories}
        onEditCategory={mockOnEditCategory}
        onDeleteCategory={mockOnDeleteCategory}
        onAddCategory={mockOnAddCategory}
      />
    );

    expect(screen.getByText('Contas')).toBeInTheDocument();
    expect(screen.getByText('Categorias')).toBeInTheDocument();
  });

  it('switches to categories tab when clicked', async () => {
    const user = userEvent.setup();
    render(
      <ManageView
        accounts={mockAccounts}
        onEditAccount={mockOnEditAccount}
        onDeleteAccount={mockOnDeleteAccount}
        onAddAccount={mockOnAddAccount}
        categories={mockCategories}
        onEditCategory={mockOnEditCategory}
        onDeleteCategory={mockOnDeleteCategory}
        onAddCategory={mockOnAddCategory}
      />
    );

    const categoriasTab = screen.getByText('Categorias');
    await user.click(categoriasTab);

    expect(categoriasTab).toHaveClass('bg-white');
    expect(screen.getByText('Minhas Categorias')).toBeInTheDocument();
  });

  it('shows AccountsView when accounts tab is active', () => {
    render(
      <ManageView
        accounts={mockAccounts}
        onEditAccount={mockOnEditAccount}
        onDeleteAccount={mockOnDeleteAccount}
        onAddAccount={mockOnAddAccount}
        categories={mockCategories}
        onEditCategory={mockOnEditCategory}
        onDeleteCategory={mockOnDeleteCategory}
        onAddCategory={mockOnAddCategory}
      />
    );

    expect(screen.getByText('Minhas Contas')).toBeInTheDocument();
    expect(screen.getByText('Conta Corrente')).toBeInTheDocument();
  });

  it('shows CategoriesView when categories tab is active', async () => {
    const user = userEvent.setup();
    render(
      <ManageView
        accounts={mockAccounts}
        onEditAccount={mockOnEditAccount}
        onDeleteAccount={mockOnDeleteAccount}
        onAddAccount={mockOnAddAccount}
        categories={mockCategories}
        onEditCategory={mockOnEditCategory}
        onDeleteCategory={mockOnDeleteCategory}
        onAddCategory={mockOnAddCategory}
      />
    );

    await user.click(screen.getByText('Categorias'));

    expect(screen.getByText('Minhas Categorias')).toBeInTheDocument();
    expect(screen.getByText('Alimentação')).toBeInTheDocument();
  });

  it('passes correct props to AccountsView', () => {
    render(
      <ManageView
        accounts={mockAccounts}
        onEditAccount={mockOnEditAccount}
        onDeleteAccount={mockOnDeleteAccount}
        onAddAccount={mockOnAddAccount}
        categories={mockCategories}
        onEditCategory={mockOnEditCategory}
        onDeleteCategory={mockOnDeleteCategory}
        onAddCategory={mockOnAddCategory}
      />
    );

    expect(screen.getByText('Adicionar Conta')).toBeInTheDocument();
  });

  it('passes correct props to CategoriesView', async () => {
    const user = userEvent.setup();
    render(
      <ManageView
        accounts={mockAccounts}
        onEditAccount={mockOnEditAccount}
        onDeleteAccount={mockOnDeleteAccount}
        onAddAccount={mockOnAddAccount}
        categories={mockCategories}
        onEditCategory={mockOnEditCategory}
        onDeleteCategory={mockOnDeleteCategory}
        onAddCategory={mockOnAddCategory}
      />
    );

    await user.click(screen.getByText('Categorias'));

    expect(screen.getByText('Adicionar Categoria')).toBeInTheDocument();
  });

  it('highlights active tab', async () => {
    const user = userEvent.setup();
    render(
      <ManageView
        accounts={mockAccounts}
        onEditAccount={mockOnEditAccount}
        onDeleteAccount={mockOnDeleteAccount}
        onAddAccount={mockOnAddAccount}
        categories={mockCategories}
        onEditCategory={mockOnEditCategory}
        onDeleteCategory={mockOnDeleteCategory}
        onAddCategory={mockOnAddCategory}
      />
    );

    const contasTab = screen.getByText('Contas');
    const categoriasTab = screen.getByText('Categorias');

    expect(contasTab).toHaveClass('bg-white');
    expect(categoriasTab).not.toHaveClass('bg-white');

    await user.click(categoriasTab);

    expect(categoriasTab).toHaveClass('bg-white');
    expect(contasTab).not.toHaveClass('bg-white');
  });
});
