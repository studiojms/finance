import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuickActionPopup } from './QuickActionPopup';
import { TransactionType } from '../types';

describe('QuickActionPopup', () => {
  const mockOnClose = vi.fn();
  const mockOnSelect = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(<QuickActionPopup isOpen={false} onClose={mockOnClose} onSelect={mockOnSelect} />);

    expect(screen.queryByText('Novo Lançamento')).not.toBeInTheDocument();
  });

  it('renders when isOpen is true', () => {
    render(<QuickActionPopup isOpen={true} onClose={mockOnClose} onSelect={mockOnSelect} />);

    expect(screen.getByText('Novo Lançamento')).toBeInTheDocument();
  });

  it('renders all transaction type options', () => {
    render(<QuickActionPopup isOpen={true} onClose={mockOnClose} onSelect={mockOnSelect} />);

    expect(screen.getByText('Despesa')).toBeInTheDocument();
    expect(screen.getByText('Receita')).toBeInTheDocument();
    expect(screen.getByText('Transferência')).toBeInTheDocument();
  });

  it('calls onSelect with expense type when expense button is clicked', async () => {
    const user = userEvent.setup();
    render(<QuickActionPopup isOpen={true} onClose={mockOnClose} onSelect={mockOnSelect} />);

    await user.click(screen.getByText('Despesa'));

    expect(mockOnSelect).toHaveBeenCalledWith('expense');
  });

  it('calls onSelect with income type when income button is clicked', async () => {
    const user = userEvent.setup();
    render(<QuickActionPopup isOpen={true} onClose={mockOnClose} onSelect={mockOnSelect} />);

    await user.click(screen.getByText('Receita'));

    expect(mockOnSelect).toHaveBeenCalledWith('income');
  });

  it('calls onSelect with transfer type when transfer button is clicked', async () => {
    const user = userEvent.setup();
    render(<QuickActionPopup isOpen={true} onClose={mockOnClose} onSelect={mockOnSelect} />);

    await user.click(screen.getByText('Transferência'));

    expect(mockOnSelect).toHaveBeenCalledWith('transfer');
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<QuickActionPopup isOpen={true} onClose={mockOnClose} onSelect={mockOnSelect} />);

    const closeButton = screen.getAllByRole('button')[0];
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(<QuickActionPopup isOpen={true} onClose={mockOnClose} onSelect={mockOnSelect} />);

    const backdrop = container.querySelector('.bg-slate-900\\/40');
    if (backdrop) {
      await user.click(backdrop);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }
  });
});
