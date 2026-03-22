import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InstallmentDeleteModal } from './InstallmentDeleteModal';
import { Transaction } from '../../types';

describe('InstallmentDeleteModal', () => {
  const mockTransaction: Transaction = {
    id: 'trans1',
    description: 'Parcela Teste',
    amount: 100,
    date: '2026-03-20T12:00:00.000Z',
    type: 'expense',
    accountId: 'acc1',
    categoryId: 'cat1',
    userId: 'user1',
    isConsolidated: true,
    installmentId: 'inst1',
    installmentNumber: 2,
    totalInstallments: 5,
  };

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    transaction: mockTransaction,
    onConfirm: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal when open', () => {
    render(<InstallmentDeleteModal {...defaultProps} />);

    expect(screen.getByText('Excluir Parcela')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<InstallmentDeleteModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Excluir Parcela')).not.toBeInTheDocument();
  });

  it('shows installment information with total installments', () => {
    render(<InstallmentDeleteModal {...defaultProps} />);

    expect(screen.getByText(/Este lançamento é a parcela 2\/5/i)).toBeInTheDocument();
  });

  it('shows installment information without total installments', () => {
    const transactionWithoutTotal = {
      ...mockTransaction,
      totalInstallments: undefined,
    };

    render(<InstallmentDeleteModal {...defaultProps} transaction={transactionWithoutTotal} />);

    expect(screen.getByText(/Este lançamento é a parcela #2/i)).toBeInTheDocument();
  });

  it('shows only this option by default', () => {
    render(<InstallmentDeleteModal {...defaultProps} />);

    const onlyThisRadio = screen.getByRole('radio', { name: /apenas esta parcela/i });
    expect(onlyThisRadio).toBeChecked();
  });

  it('shows this and future option', () => {
    render(<InstallmentDeleteModal {...defaultProps} />);

    expect(screen.getByText('Esta e parcelas futuras')).toBeInTheDocument();
  });

  it('allows switching between delete modes', async () => {
    const user = userEvent.setup();
    render(<InstallmentDeleteModal {...defaultProps} />);

    const futureRadio = screen.getByRole('radio', { name: /esta e parcelas futuras/i });
    await user.click(futureRadio);

    expect(futureRadio).toBeChecked();
  });

  it('calls onConfirm with only mode when confirmed', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<InstallmentDeleteModal {...defaultProps} onConfirm={onConfirm} />);

    const excluirButton = screen.getByRole('button', { name: 'Excluir' });
    await user.click(excluirButton);

    expect(onConfirm).toHaveBeenCalledWith('only');
  });

  it('calls onConfirm with future mode when confirmed', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<InstallmentDeleteModal {...defaultProps} onConfirm={onConfirm} />);

    const futureRadio = screen.getByRole('radio', { name: /esta e parcelas futuras/i });
    await user.click(futureRadio);

    const excluirButton = screen.getByRole('button', { name: 'Excluir' });
    await user.click(excluirButton);

    expect(onConfirm).toHaveBeenCalledWith('future');
  });

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<InstallmentDeleteModal {...defaultProps} onClose={onClose} />);

    const cancelButton = screen.getByRole('button', { name: 'Cancelar' });
    await user.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when X button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<InstallmentDeleteModal {...defaultProps} onClose={onClose} />);

    const closeButtons = screen.getAllByRole('button');
    const xButton = closeButtons.find((btn) => btn.querySelector('svg'));

    await user.click(xButton!);

    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose after confirming deletion', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<InstallmentDeleteModal {...defaultProps} onClose={onClose} />);

    const excluirButton = screen.getByRole('button', { name: 'Excluir' });
    await user.click(excluirButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('shows warning message about installment', () => {
    render(<InstallmentDeleteModal {...defaultProps} />);

    expect(screen.getByText('Lançamento Parcelado')).toBeInTheDocument();
  });

  it('explains only this option correctly', () => {
    render(<InstallmentDeleteModal {...defaultProps} />);

    expect(screen.getByText(/exclui somente a parcela.*mantendo as demais/i)).toBeInTheDocument();
  });

  it('explains future option correctly', () => {
    render(<InstallmentDeleteModal {...defaultProps} />);

    expect(screen.getByText(/exclui a parcela.*e todas as parcelas seguintes/i)).toBeInTheDocument();
  });

  describe('Infinite Installments', () => {
    const infiniteTransaction: Transaction = {
      id: 'trans2',
      description: 'Internet (#3)',
      amount: 100,
      date: '2026-03-20T12:00:00.000Z',
      type: 'expense',
      accountId: 'acc1',
      categoryId: 'cat1',
      userId: 'user1',
      isConsolidated: true,
      installmentId: 'inst2',
      installmentNumber: 3,
      totalInstallments: null,
    };

    it('shows correct label for infinite installments', () => {
      render(<InstallmentDeleteModal {...defaultProps} transaction={infiniteTransaction} />);

      expect(screen.getByText('Lançamento Indefinido')).toBeInTheDocument();
    });

    it('shows infinite installment information in warning', () => {
      render(<InstallmentDeleteModal {...defaultProps} transaction={infiniteTransaction} />);

      expect(screen.getByText(/faz parte de uma série indefinida \(ocorrência #3\)/i)).toBeInTheDocument();
    });

    it('shows "ocorrência" instead of "parcela" for infinite installments', () => {
      render(<InstallmentDeleteModal {...defaultProps} transaction={infiniteTransaction} />);

      expect(screen.getByText(/apenas esta ocorrência/i)).toBeInTheDocument();
      expect(screen.queryByText(/apenas esta parcela/i)).not.toBeInTheDocument();
    });

    it('shows correct future deletion text for infinite installments', () => {
      render(<InstallmentDeleteModal {...defaultProps} transaction={infiniteTransaction} />);

      expect(screen.getByText(/esta e ocorrências futuras/i)).toBeInTheDocument();
      expect(screen.getByText(/encerra a série/i)).toBeInTheDocument();
    });

    it('shows correct description for deleting single occurrence', () => {
      render(<InstallmentDeleteModal {...defaultProps} transaction={infiniteTransaction} />);

      expect(screen.getByText(/exclui somente esta ocorrência #3, mantendo as demais/i)).toBeInTheDocument();
    });

    it('works with delete modes for infinite installments', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();
      render(<InstallmentDeleteModal {...defaultProps} transaction={infiniteTransaction} onConfirm={onConfirm} />);

      const futureRadio = screen.getByRole('radio', { name: /esta e ocorrências futuras/i });
      await user.click(futureRadio);

      const excluirButton = screen.getByRole('button', { name: 'Excluir' });
      await user.click(excluirButton);

      expect(onConfirm).toHaveBeenCalledWith('future');
    });
  });
});
