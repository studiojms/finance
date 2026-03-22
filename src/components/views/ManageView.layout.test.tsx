import { render, screen } from '@testing-library/react';
import { ManageView } from './ManageView';
import { Account, Category } from '../../types';

describe('ManageView - Desktop Layout', () => {
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

  const mockProps = {
    accounts: mockAccounts,
    onEditAccount: vi.fn(),
    onDeleteAccount: vi.fn(),
    onAddAccount: vi.fn(),
    categories: mockCategories,
    onEditCategory: vi.fn(),
    onDeleteCategory: vi.fn(),
    onAddCategory: vi.fn(),
  };

  it('tabs container has sticky positioning for desktop view', () => {
    const { container } = render(<ManageView {...mockProps} />);

    const tabsContainer = container.querySelector('.sticky');
    expect(tabsContainer).toBeInTheDocument();
    expect(tabsContainer).toHaveClass('top-0');
    expect(tabsContainer).toHaveClass('z-10');
  });

  it('tabs have background color to prevent content showing through when scrolling', () => {
    const { container } = render(<ManageView {...mockProps} />);

    const tabsContainer = container.querySelector('.sticky');
    expect(tabsContainer).toHaveClass('bg-slate-50');
  });

  it('add button in accounts view has bottom margin to clear bottom navigation', () => {
    const { container } = render(<ManageView {...mockProps} />);

    const addButton = screen.getByText(/adicionar conta/i);
    expect(addButton).toHaveClass('mb-20');
  });

  it('add button in categories view has bottom margin to clear bottom navigation', async () => {
    const { container } = render(<ManageView {...mockProps} />);

    const categoriasTab = screen.getByText('Categorias');
    await categoriasTab.click();

    const addButton = screen.getByText(/adicionar categoria/i);
    expect(addButton).toHaveClass('mb-20');
  });
});
