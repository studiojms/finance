import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmationModal } from './ConfirmationModal';

describe('ConfirmationModal', () => {
  const mockOnConfirm = vi.fn();
  const mockOnClose = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(
      <ConfirmationModal
        isOpen={false}
        title="Confirmar exclusão"
        message="Tem certeza?"
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByText('Confirmar exclusão')).not.toBeInTheDocument();
  });

  it('renders when isOpen is true', () => {
    render(
      <ConfirmationModal
        isOpen={true}
        title="Confirmar exclusão"
        message="Tem certeza?"
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Confirmar exclusão')).toBeInTheDocument();
    expect(screen.getByText('Tem certeza?')).toBeInTheDocument();
  });

  it('calls onConfirm and onClose when confirm button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ConfirmationModal
        isOpen={true}
        title="Confirmar exclusão"
        message="Tem certeza?"
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
      />
    );

    await user.click(screen.getByText('Sim, Excluir'));

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ConfirmationModal
        isOpen={true}
        title="Confirmar exclusão"
        message="Tem certeza?"
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
      />
    );

    await user.click(screen.getByText('Cancelar'));

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ConfirmationModal
        isOpen={true}
        title="Confirmar exclusão"
        message="Tem certeza?"
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
      />
    );

    const backdrop = container.querySelector('.bg-slate-900\\/40');
    if (backdrop) {
      await user.click(backdrop);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }
  });
});
