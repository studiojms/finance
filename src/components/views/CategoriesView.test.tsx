import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoriesView } from './CategoriesView';
import { Category } from '../../types';

describe('CategoriesView', () => {
  const mockCategories: Category[] = [
    {
      id: '1',
      name: 'Alimentação',
      icon: 'Utensils',
      color: '#ef4444',
      type: 'expense',
      userId: 'user1',
    },
    {
      id: '2',
      name: 'Salário',
      icon: 'Briefcase',
      color: '#10b981',
      type: 'income',
      userId: 'user1',
    },
    {
      id: '3',
      name: 'Investimento',
      icon: 'TrendingUp',
      color: '#3b82f6',
      type: 'both',
      userId: 'user1',
    },
    {
      id: '4',
      name: 'Transporte',
      icon: 'Car',
      color: '#f59e0b',
      type: 'expense',
      userId: null,
    },
  ];

  const mockOnEditCategory = vi.fn();
  const mockOnDeleteCategory = vi.fn();
  const mockOnAddCategory = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders title', () => {
    render(
      <CategoriesView
        categories={mockCategories}
        onEditCategory={mockOnEditCategory}
        onDeleteCategory={mockOnDeleteCategory}
        onAddCategory={mockOnAddCategory}
      />
    );

    expect(screen.getByText('Minhas Categorias')).toBeInTheDocument();
  });

  it('renders expense categories section', () => {
    render(
      <CategoriesView
        categories={mockCategories}
        onEditCategory={mockOnEditCategory}
        onDeleteCategory={mockOnDeleteCategory}
        onAddCategory={mockOnAddCategory}
      />
    );

    expect(screen.getByText('Despesas')).toBeInTheDocument();
  });

  it('renders income categories section', () => {
    render(
      <CategoriesView
        categories={mockCategories}
        onEditCategory={mockOnEditCategory}
        onDeleteCategory={mockOnDeleteCategory}
        onAddCategory={mockOnAddCategory}
      />
    );

    expect(screen.getByText('Receitas')).toBeInTheDocument();
  });

  it('renders all categories', () => {
    render(
      <CategoriesView
        categories={mockCategories}
        onEditCategory={mockOnEditCategory}
        onDeleteCategory={mockOnDeleteCategory}
        onAddCategory={mockOnAddCategory}
      />
    );

    expect(screen.getByText('Alimentação')).toBeInTheDocument();
    expect(screen.getByText('Salário')).toBeInTheDocument();
    expect(screen.getAllByText('Investimento')).toHaveLength(2);
    expect(screen.getByText('Transporte')).toBeInTheDocument();
  });

  it('displays category types correctly', () => {
    render(
      <CategoriesView
        categories={mockCategories}
        onEditCategory={mockOnEditCategory}
        onDeleteCategory={mockOnDeleteCategory}
        onAddCategory={mockOnAddCategory}
      />
    );

    expect(screen.getAllByText('Despesa').length).toBeGreaterThan(0);
    expect(screen.getByText('Receita')).toBeInTheDocument();
    expect(screen.getAllByText('Ambos').length).toBeGreaterThan(0);
  });

  it('calls onEditCategory when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CategoriesView
        categories={mockCategories}
        onEditCategory={mockOnEditCategory}
        onDeleteCategory={mockOnDeleteCategory}
        onAddCategory={mockOnAddCategory}
      />
    );

    const categoryCards = screen.getAllByRole('button').filter((btn) => {
      return btn.className.includes('hover:text-emerald-500');
    });

    await user.click(categoryCards[0]);

    expect(mockOnEditCategory).toHaveBeenCalledTimes(1);
    expect(mockOnEditCategory).toHaveBeenCalledWith(mockCategories[0]);
  });

  it('calls onDeleteCategory when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CategoriesView
        categories={mockCategories}
        onEditCategory={mockOnEditCategory}
        onDeleteCategory={mockOnDeleteCategory}
        onAddCategory={mockOnAddCategory}
      />
    );

    const deleteButtons = screen.getAllByRole('button').filter((btn) => {
      return btn.className.includes('hover:text-rose-500');
    });

    await user.click(deleteButtons[0]);

    expect(mockOnDeleteCategory).toHaveBeenCalledTimes(1);
    expect(mockOnDeleteCategory).toHaveBeenCalledWith(mockCategories[0]);
  });

  it('does not show delete button for default categories', () => {
    render(
      <CategoriesView
        categories={mockCategories}
        onEditCategory={mockOnEditCategory}
        onDeleteCategory={mockOnDeleteCategory}
        onAddCategory={mockOnAddCategory}
      />
    );

    const deleteButtons = screen.getAllByRole('button').filter((btn) => {
      return btn.className.includes('hover:text-rose-500');
    });

    expect(deleteButtons.length).toBe(4);
  });

  it('calls onAddCategory when add button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CategoriesView
        categories={mockCategories}
        onEditCategory={mockOnEditCategory}
        onDeleteCategory={mockOnDeleteCategory}
        onAddCategory={mockOnAddCategory}
      />
    );

    await user.click(screen.getByText('Adicionar Categoria'));

    expect(mockOnAddCategory).toHaveBeenCalledTimes(1);
  });

  it('groups expense and both categories together', () => {
    render(
      <CategoriesView
        categories={mockCategories}
        onEditCategory={mockOnEditCategory}
        onDeleteCategory={mockOnDeleteCategory}
        onAddCategory={mockOnAddCategory}
      />
    );

    const despesasSection = screen.getByText('Despesas').closest('div');
    expect(despesasSection).toBeInTheDocument();
  });

  it('groups income and both categories together', () => {
    render(
      <CategoriesView
        categories={mockCategories}
        onEditCategory={mockOnEditCategory}
        onDeleteCategory={mockOnDeleteCategory}
        onAddCategory={mockOnAddCategory}
      />
    );

    const receitasSection = screen.getByText('Receitas').closest('div');
    expect(receitasSection).toBeInTheDocument();
  });

  it('renders empty state when no categories', () => {
    render(
      <CategoriesView
        categories={[]}
        onEditCategory={mockOnEditCategory}
        onDeleteCategory={mockOnDeleteCategory}
        onAddCategory={mockOnAddCategory}
      />
    );

    expect(screen.getByText('Adicionar Categoria')).toBeInTheDocument();
  });
});
