import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataErasureModal, DataErasureMode } from './DataErasureModal';

describe('DataErasureModal', () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(<DataErasureModal isOpen={false} onClose={mockOnClose} onConfirm={mockOnConfirm} isDeleting={false} />);

    expect(screen.queryByText('Apagar Dados')).not.toBeInTheDocument();
  });

  it('renders the modal when isOpen is true', () => {
    render(<DataErasureModal isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} isDeleting={false} />);

    expect(screen.getByText('Apagar Dados')).toBeInTheDocument();
    expect(screen.getByText('Atenção!')).toBeInTheDocument();
    expect(screen.getByText(/Esta ação é irreversível/)).toBeInTheDocument();
  });

  it('displays all deletion mode options', () => {
    render(<DataErasureModal isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} isDeleting={false} />);

    expect(screen.getByText('Apenas Transações')).toBeInTheDocument();
    expect(screen.getByText('Transações + Contas')).toBeInTheDocument();
    expect(screen.getByText('Transações + Categorias')).toBeInTheDocument();
    expect(screen.getByText('Tudo')).toBeInTheDocument();
  });

  it('shows confirmation screen when a mode is selected', async () => {
    const user = userEvent.setup();
    render(<DataErasureModal isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} isDeleting={false} />);

    const transactionsButton = screen.getByText('Apenas Transações');
    await user.click(transactionsButton);

    await waitFor(() => {
      expect(screen.getByText('Confirmar Exclusão')).toBeInTheDocument();
      expect(screen.getByText('Você está prestes a excluir dados permanentemente.')).toBeInTheDocument();
    });
  });

  it('calls onConfirm with correct mode when confirmed', async () => {
    const user = userEvent.setup();
    render(<DataErasureModal isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} isDeleting={false} />);

    const accountsButton = screen.getByText('Transações + Contas');
    await user.click(accountsButton);

    await waitFor(() => {
      expect(screen.getByText('Confirmar Exclusão')).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /Sim, Excluir/i });
    await user.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledWith('transactions-accounts');
  });

  it('can cancel from confirmation screen', async () => {
    const user = userEvent.setup();
    render(<DataErasureModal isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} isDeleting={false} />);

    const allButton = screen.getByText('Tudo');
    await user.click(allButton);

    await waitFor(() => {
      expect(screen.getByText('Confirmar Exclusão')).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.getByText('Apagar Dados')).toBeInTheDocument();
      expect(screen.queryByText('Confirmar Exclusão')).not.toBeInTheDocument();
    });

    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('disables buttons and shows loading state when isDeleting is true', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <DataErasureModal isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} isDeleting={false} />
    );

    const transactionsButton = screen.getByText('Apenas Transações');
    await user.click(transactionsButton);

    await waitFor(() => {
      expect(screen.getByText('Confirmar Exclusão')).toBeInTheDocument();
    });

    rerender(<DataErasureModal isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} isDeleting={true} />);

    await waitFor(() => {
      expect(screen.getByText('Excluindo...')).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /Excluindo.../i });
    expect(confirmButton).toBeDisabled();
  });

  it('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    render(<DataErasureModal isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} isDeleting={false} />);

    const backdrop = screen.getByText('Apagar Dados').closest('div')?.previousSibling;
    if (backdrop) {
      await user.click(backdrop as Element);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  it('calls onClose when X button is clicked', async () => {
    const user = userEvent.setup();
    render(<DataErasureModal isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} isDeleting={false} />);

    const closeButton = screen.getByRole('button', { name: '' });
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  describe('Mode Selection', () => {
    it('passes "transactions" mode correctly', async () => {
      const user = userEvent.setup();
      render(<DataErasureModal isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} isDeleting={false} />);

      await user.click(screen.getByText('Apenas Transações'));
      await waitFor(() => {
        expect(screen.getByText('Confirmar Exclusão')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Sim, Excluir/i }));
      expect(mockOnConfirm).toHaveBeenCalledWith('transactions');
    });

    it('passes "transactions-categories" mode correctly', async () => {
      const user = userEvent.setup();
      render(<DataErasureModal isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} isDeleting={false} />);

      await user.click(screen.getByText('Transações + Categorias'));
      await waitFor(() => {
        expect(screen.getByText('Confirmar Exclusão')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Sim, Excluir/i }));
      expect(mockOnConfirm).toHaveBeenCalledWith('transactions-categories');
    });

    it('passes "all" mode correctly', async () => {
      const user = userEvent.setup();
      render(<DataErasureModal isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} isDeleting={false} />);

      await user.click(screen.getByText('Tudo'));
      await waitFor(() => {
        expect(screen.getByText('Confirmar Exclusão')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Sim, Excluir/i }));
      expect(mockOnConfirm).toHaveBeenCalledWith('all');
    });
  });
});
