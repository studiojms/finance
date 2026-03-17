import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccountsView } from './AccountsView';
import { Account } from '../../types';

describe('AccountsView', () => {
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

  const mockOnEditAccount = vi.fn();
  const mockOnDeleteAccount = vi.fn();
  const mockOnAddAccount = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders title', () => {
    render(
      <AccountsView
        accounts={mockAccounts}
        onEditAccount={mockOnEditAccount}
        onDeleteAccount={mockOnDeleteAccount}
        onAddAccount={mockOnAddAccount}
      />
    );

    expect(screen.getByText('Minhas Contas')).toBeInTheDocument();
  });

  it('renders all accounts', () => {
    render(
      <AccountsView
        accounts={mockAccounts}
        onEditAccount={mockOnEditAccount}
        onDeleteAccount={mockOnDeleteAccount}
        onAddAccount={mockOnAddAccount}
      />
    );

    expect(screen.getByText('Conta Corrente')).toBeInTheDocument();
    expect(screen.getByText('Poupança')).toBeInTheDocument();
  });

  it('displays account balances', () => {
    render(
      <AccountsView
        accounts={mockAccounts}
        onEditAccount={mockOnEditAccount}
        onDeleteAccount={mockOnDeleteAccount}
        onAddAccount={mockOnAddAccount}
      />
    );

    expect(screen.getByText('R$ 1.000,00')).toBeInTheDocument();
    expect(screen.getByText('R$ 5.000,00')).toBeInTheDocument();
  });

  it('displays account types', () => {
    render(
      <AccountsView
        accounts={mockAccounts}
        onEditAccount={mockOnEditAccount}
        onDeleteAccount={mockOnDeleteAccount}
        onAddAccount={mockOnAddAccount}
      />
    );

    expect(screen.getByText('checking')).toBeInTheDocument();
    expect(screen.getByText('savings')).toBeInTheDocument();
  });

  it('calls onEditAccount when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <AccountsView
        accounts={mockAccounts}
        onEditAccount={mockOnEditAccount}
        onDeleteAccount={mockOnDeleteAccount}
        onAddAccount={mockOnAddAccount}
      />
    );

    const editButtons = screen.getAllByRole('button').filter((btn) => btn.querySelector('svg'));
    await user.click(editButtons[0]);

    expect(mockOnEditAccount).toHaveBeenCalledWith(mockAccounts[0]);
  });

  it('calls onDeleteAccount when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <AccountsView
        accounts={mockAccounts}
        onEditAccount={mockOnEditAccount}
        onDeleteAccount={mockOnDeleteAccount}
        onAddAccount={mockOnAddAccount}
      />
    );

    const deleteButtons = screen.getAllByRole('button').filter((btn) => btn.querySelector('svg'));
    await user.click(deleteButtons[1]);

    expect(mockOnDeleteAccount).toHaveBeenCalledWith(mockAccounts[0]);
  });

  it('calls onAddAccount when add button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <AccountsView
        accounts={mockAccounts}
        onEditAccount={mockOnEditAccount}
        onDeleteAccount={mockOnDeleteAccount}
        onAddAccount={mockOnAddAccount}
      />
    );

    await user.click(screen.getByText('Adicionar Conta'));

    expect(mockOnAddAccount).toHaveBeenCalledTimes(1);
  });

  it('shows add account button', () => {
    render(
      <AccountsView
        accounts={mockAccounts}
        onEditAccount={mockOnEditAccount}
        onDeleteAccount={mockOnDeleteAccount}
        onAddAccount={mockOnAddAccount}
      />
    );

    expect(screen.getByText('Adicionar Conta')).toBeInTheDocument();
  });
});
