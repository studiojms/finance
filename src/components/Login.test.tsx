import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Login } from './Login';

vi.mock('../firebase', () => ({
  auth: {},
}));

vi.mock('firebase/auth', () => ({
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  updateProfile: vi.fn(),
}));

describe('Login', () => {
  it('renders login form', () => {
    render(<Login />);

    expect(screen.getByText('Finanças Pro')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('exemplo@email.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  it('renders sign in button by default', () => {
    render(<Login />);

    expect(screen.getByRole('button', { name: /^entrar$/i })).toBeInTheDocument();
  });

  it('toggles to sign up form', async () => {
    const user = userEvent.setup();
    render(<Login />);

    const toggleButton = screen.getByText('Cadastre-se');
    await user.click(toggleButton);

    expect(screen.getByPlaceholderText('Seu nome')).toBeInTheDocument();
  });

  it('allows typing in email field', async () => {
    const user = userEvent.setup();
    render(<Login />);

    const emailInput = screen.getByPlaceholderText('exemplo@email.com');
    await user.type(emailInput, 'test@example.com');

    expect(emailInput).toHaveValue('test@example.com');
  });

  it('allows typing in password field', async () => {
    const user = userEvent.setup();
    render(<Login />);

    const passwordInput = screen.getByPlaceholderText('••••••••');
    await user.type(passwordInput, 'password123');

    expect(passwordInput).toHaveValue('password123');
  });

  it('displays Google login button', () => {
    render(<Login />);

    expect(screen.getByText('Entrar com Google')).toBeInTheDocument();
  });
});
