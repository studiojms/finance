import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryModal } from './CategoryModal';
import { Category } from '../../types';

vi.mock('../../firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  collection: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
}));

describe('CategoryModal', () => {
  const mockOnClose = vi.fn();
  const userId = 'user1';

  const mockCategory: Category = {
    id: 'cat1',
    name: 'Alimentação',
    icon: 'Utensils',
    color: '#ef4444',
    type: 'expense',
    userId: 'user1',
  };

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when closed', () => {
    render(<CategoryModal isOpen={false} onClose={mockOnClose} userId={userId} editingCategory={null} />);

    expect(screen.queryByText('Nova Categoria')).not.toBeInTheDocument();
  });

  it('renders create modal when open and no editing category', () => {
    render(<CategoryModal isOpen={true} onClose={mockOnClose} userId={userId} editingCategory={null} />);

    expect(screen.getByText('Nova Categoria')).toBeInTheDocument();
  });

  it('renders edit modal when editing category', () => {
    render(<CategoryModal isOpen={true} onClose={mockOnClose} userId={userId} editingCategory={mockCategory} />);

    expect(screen.getByText('Editar Categoria')).toBeInTheDocument();
  });

  it('populates form fields when editing category', () => {
    render(<CategoryModal isOpen={true} onClose={mockOnClose} userId={userId} editingCategory={mockCategory} />);

    const nameInput = screen.getByPlaceholderText('Nome da Categoria') as HTMLInputElement;
    expect(nameInput.value).toBe('Alimentação');
  });

  it('allows user to input category name', async () => {
    const user = userEvent.setup();
    render(<CategoryModal isOpen={true} onClose={mockOnClose} userId={userId} editingCategory={null} />);

    const nameInput = screen.getByPlaceholderText('Nome da Categoria');
    await user.type(nameInput, 'Nova Categoria');

    expect(nameInput).toHaveValue('Nova Categoria');
  });

  it('displays type selection buttons', () => {
    render(<CategoryModal isOpen={true} onClose={mockOnClose} userId={userId} editingCategory={null} />);

    expect(screen.getByText('Despesa')).toBeInTheDocument();
    expect(screen.getByText('Receita')).toBeInTheDocument();
    expect(screen.getByText('Ambos')).toBeInTheDocument();
  });

  it('allows user to select type', async () => {
    const user = userEvent.setup();
    render(<CategoryModal isOpen={true} onClose={mockOnClose} userId={userId} editingCategory={null} />);

    const receitaButton = screen.getByText('Receita');
    await user.click(receitaButton);

    expect(receitaButton.closest('button')).toHaveClass('bg-emerald-600');
  });

  it('displays icon selection grid', () => {
    render(<CategoryModal isOpen={true} onClose={mockOnClose} userId={userId} editingCategory={null} />);

    expect(screen.getByText('Ícone')).toBeInTheDocument();
    const iconButtons = screen.getAllByRole('button').filter((btn) => btn.querySelector('svg') && !btn.textContent);
    expect(iconButtons.length).toBeGreaterThan(10);
  });

  it('displays color selection grid', () => {
    render(<CategoryModal isOpen={true} onClose={mockOnClose} userId={userId} editingCategory={null} />);

    expect(screen.getByText('Cor')).toBeInTheDocument();
    const colorButtons = screen.getAllByRole('button').filter((btn) => {
      const style = btn.getAttribute('style');
      return style && style.includes('background-color');
    });
    expect(colorButtons.length).toBeGreaterThan(10);
  });

  it('displays create button when creating new category', () => {
    render(<CategoryModal isOpen={true} onClose={mockOnClose} userId={userId} editingCategory={null} />);

    expect(screen.getByText('Criar Categoria')).toBeInTheDocument();
  });

  it('displays save button when editing category', () => {
    render(<CategoryModal isOpen={true} onClose={mockOnClose} userId={userId} editingCategory={mockCategory} />);

    expect(screen.getByText('Salvar Alterações')).toBeInTheDocument();
  });

  it('save button is disabled when name is empty', () => {
    render(<CategoryModal isOpen={true} onClose={mockOnClose} userId={userId} editingCategory={null} />);

    const saveButton = screen.getByText('Criar Categoria').closest('button');
    expect(saveButton).toBeDisabled();
  });

  it('save button is enabled when name is provided', async () => {
    const user = userEvent.setup();
    render(<CategoryModal isOpen={true} onClose={mockOnClose} userId={userId} editingCategory={null} />);

    const nameInput = screen.getByPlaceholderText('Nome da Categoria');
    await user.type(nameInput, 'Nova Categoria');

    const saveButton = screen.getByText('Criar Categoria').closest('button');
    expect(saveButton).not.toBeDisabled();
  });

  it('closes modal when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<CategoryModal isOpen={true} onClose={mockOnClose} userId={userId} editingCategory={null} />);

    const closeButton = screen.getAllByRole('button')[0];
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('closes modal when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <CategoryModal isOpen={true} onClose={mockOnClose} userId={userId} editingCategory={null} />
    );

    const backdrop = container.querySelector('.fixed.inset-0');
    if (backdrop) {
      await user.click(backdrop);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }
  });

  it('allows selecting different icons', async () => {
    const user = userEvent.setup();
    render(<CategoryModal isOpen={true} onClose={mockOnClose} userId={userId} editingCategory={null} />);

    const iconButtons = screen.getAllByRole('button').filter((btn) => btn.querySelector('svg') && !btn.textContent);

    await user.click(iconButtons[2]);

    expect(iconButtons[2]).toHaveClass('scale-110');
  });

  it('allows selecting different colors', async () => {
    const user = userEvent.setup();
    render(<CategoryModal isOpen={true} onClose={mockOnClose} userId={userId} editingCategory={null} />);

    const colorButtons = screen.getAllByRole('button').filter((btn) => {
      const style = btn.getAttribute('style');
      return style && style.includes('background-color');
    });

    await user.click(colorButtons[3]);

    expect(colorButtons[3]).toHaveClass('scale-110');
  });
});
