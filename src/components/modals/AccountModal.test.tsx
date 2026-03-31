import { render, screen } from '@testing-library/react';
import { AccountModal } from './AccountModal';
import { Account, Transaction } from '../../types';

vi.mock('firebase/firestore', () => ({
  addDoc: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  updateDoc: vi.fn(),
}));

vi.mock('../../firebase', () => ({
  db: {},
}));

describe('AccountModal - Mobile Responsive Layout', () => {
  const mockTransactions: Transaction[] = [];

  const mockAccount: Account = {
    id: '1',
    name: 'Conta Corrente',
    type: 'checking',
    balance: 1000,
    initialBalance: 1000,
    initialBalanceDate: '2026-01-01',
    color: '#10b981',
    icon: 'Banknote',
    userId: 'user1',
  };

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    userId: 'user1',
    editingAccount: null,
    transactions: mockTransactions,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders account modal when open', () => {
    render(<AccountModal {...defaultProps} />);

    expect(screen.getByText('Nova Conta')).toBeInTheDocument();
  });

  it('initial balance fields container has mobile-responsive flex classes', () => {
    render(<AccountModal {...defaultProps} />);

    const initialBalanceLabel = screen.getByText('Saldo Inicial (Base)');
    const fieldsContainer = initialBalanceLabel.parentElement?.querySelector('.flex');

    expect(fieldsContainer?.className).toContain('flex');
    expect(fieldsContainer?.className).toContain('flex-col');
    expect(fieldsContainer?.className).toContain('md:flex-row');
  });

  it('date input has responsive width class', () => {
    const { container } = render(<AccountModal {...defaultProps} />);

    const dateInputs = container.querySelectorAll('input[type="date"]');
    const initialBalanceDateInput = dateInputs[0];

    expect(initialBalanceDateInput.className).toContain('md:w-40');
  });

  it('renders edit mode correctly with existing account', () => {
    render(<AccountModal {...defaultProps} editingAccount={mockAccount} />);

    expect(screen.getByText('Editar Conta')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Nome da Conta')).toHaveValue('Conta Corrente');
  });

  it('mobile layout stacks fields vertically on small screens', () => {
    render(<AccountModal {...defaultProps} />);

    const initialBalanceLabel = screen.getByText('Saldo Inicial (Base)');
    const fieldsContainer = initialBalanceLabel.parentElement?.querySelector('.flex');

    expect(fieldsContainer?.className).toMatch(/flex-col/);
  });

  it('desktop layout arranges fields horizontally on medium screens', () => {
    render(<AccountModal {...defaultProps} />);

    const initialBalanceLabel = screen.getByText('Saldo Inicial (Base)');
    const fieldsContainer = initialBalanceLabel.parentElement?.querySelector('.flex');

    expect(fieldsContainer?.className).toMatch(/md:flex-row/);
  });
});
