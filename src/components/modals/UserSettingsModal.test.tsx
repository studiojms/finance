import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserSettingsModal } from './UserSettingsModal';
import { AuthUser } from '../../services/authService';

describe('UserSettingsModal', () => {
  const mockUser: AuthUser = {
    uid: 'test-user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: 'https://example.com/photo.jpg',
  };

  const mockOnClose = vi.fn();
  const mockSetIncludePreviousBalance = vi.fn();
  const mockSetTransactionSortOrder = vi.fn();
  const mockOnLogout = vi.fn();
  const mockOnEraseData = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    user: mockUser,
    includePreviousBalance: true,
    setIncludePreviousBalance: mockSetIncludePreviousBalance,
    transactionSortOrder: 'desc' as const,
    setTransactionSortOrder: mockSetTransactionSortOrder,
    onLogout: mockOnLogout,
    onEraseData: mockOnEraseData,
  };

  it('does not render when isOpen is false', () => {
    render(<UserSettingsModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Configurações')).not.toBeInTheDocument();
  });

  it('renders when isOpen is true', () => {
    render(<UserSettingsModal {...defaultProps} />);

    expect(screen.getByText('Configurações')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('displays user information correctly', () => {
    render(<UserSettingsModal {...defaultProps} />);

    expect(screen.getByText(mockUser.displayName!)).toBeInTheDocument();
    expect(screen.getByText(mockUser.email!)).toBeInTheDocument();
    expect(screen.getByAltText(mockUser.displayName!)).toHaveAttribute('src', mockUser.photoURL);
  });

  it('has an erase data button in danger zone', () => {
    render(<UserSettingsModal {...defaultProps} />);

    expect(screen.getByText('Zona de Perigo')).toBeInTheDocument();
    expect(screen.getByText('Apagar Dados')).toBeInTheDocument();
  });

  it('calls onEraseData and onClose when erase data button is clicked', async () => {
    const user = userEvent.setup();
    render(<UserSettingsModal {...defaultProps} />);

    const eraseButton = screen.getByRole('button', { name: /Apagar Dados/i });
    await user.click(eraseButton);

    expect(mockOnClose).toHaveBeenCalled();
    expect(mockOnEraseData).toHaveBeenCalled();
  });

  it('calls onLogout when logout button is clicked', async () => {
    const user = userEvent.setup();
    render(<UserSettingsModal {...defaultProps} />);

    const logoutButton = screen.getByRole('button', { name: /Sair da Conta/i });
    await user.click(logoutButton);

    expect(mockOnLogout).toHaveBeenCalled();
  });

  it('toggles previous balance setting', async () => {
    const user = userEvent.setup();
    render(<UserSettingsModal {...defaultProps} />);

    const toggleButtons = screen.getAllByRole('button');
    const previousBalanceToggle = toggleButtons.find(
      (button) => button.className.includes('rounded-full') && button.className.includes('w-12')
    );

    if (previousBalanceToggle) {
      await user.click(previousBalanceToggle);
      expect(mockSetIncludePreviousBalance).toHaveBeenCalledWith(false);
    }
  });

  it('changes transaction sort order', async () => {
    const user = userEvent.setup();
    render(<UserSettingsModal {...defaultProps} />);

    const alterarButton = screen.getByRole('button', { name: /Alterar/i });
    await user.click(alterarButton);

    expect(mockSetTransactionSortOrder).toHaveBeenCalled();
  });

  it('displays correct sort order text', () => {
    render(<UserSettingsModal {...defaultProps} transactionSortOrder="desc" />);
    expect(screen.getByText('Mais recentes primeiro')).toBeInTheDocument();
  });

  it('displays correct sort order text for ascending', () => {
    render(<UserSettingsModal {...defaultProps} transactionSortOrder="asc" />);
    expect(screen.getByText('Mais antigos primeiro')).toBeInTheDocument();
  });

  it('closes modal when X button is clicked', async () => {
    const user = userEvent.setup();
    render(<UserSettingsModal {...defaultProps} />);

    const closeButton = screen.getAllByRole('button')[0];
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('closes modal when backdrop is clicked', async () => {
    const user = userEvent.setup();
    render(<UserSettingsModal {...defaultProps} />);

    const backdrop = screen.getByText('Configurações').closest('div')?.previousSibling;
    if (backdrop) {
      await user.click(backdrop as Element);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });
});
