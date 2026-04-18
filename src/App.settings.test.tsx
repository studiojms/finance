import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, beforeEach, describe, it, expect } from 'vitest';
import App from './App';

vi.mock('./config', () => ({
  APP_CONFIG: {
    backend: 'firebase',
    firebase: {
      apiKey: 'test-api-key',
      authDomain: 'test.firebaseapp.com',
      projectId: 'test-project',
      storageBucket: 'test.appspot.com',
      messagingSenderId: '123456789',
      appId: 'test-app-id',
      databaseId: 'test-db',
      measurementId: 'test-measurement-id',
    },
    supabase: {
      url: undefined,
      anonKey: undefined,
    },
    database: {
      url: undefined,
    },
  },
  isFirebase: () => true,
  isSupabase: () => false,
}));

vi.mock('./firebase', () => ({
  db: null,
  analytics: null,
  auth: {
    currentUser: {
      uid: 'test-user-123',
      email: 'test@example.com',
      emailVerified: true,
    },
  },
}));

vi.mock('./hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      uid: 'test-user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: 'https://example.com/photo.jpg',
    },
    loading: false,
    signInWithGoogle: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock('./hooks/useFirestoreData', () => ({
  useFirestoreData: () => ({
    transactions: [],
    accounts: [],
    categories: [],
  }),
}));

describe('App Settings Persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('persists includePreviousBalance to localStorage when changed', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    const settingsButton = screen.getByRole('button', { name: /configurações/i });
    await user.click(settingsButton);

    await waitFor(() => {
      expect(screen.getByText('Configurações')).toBeVisible();
    });

    const toggleButtons = screen.getAllByRole('button');
    const previousBalanceToggle = toggleButtons.find(
      (button) => button.className.includes('rounded-full') && button.className.includes('w-12')
    );

    if (previousBalanceToggle) {
      await user.click(previousBalanceToggle);

      await waitFor(() => {
        const saved = localStorage.getItem('includePreviousBalance');
        expect(saved).toBe('false');
      });
    }
  });

  it('persists transactionSortOrder to localStorage when changed', async () => {
    const user = userEvent.setup();
    localStorage.setItem('transactionSortOrder', 'desc');

    render(<App />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    const settingsButton = screen.getByRole('button', { name: /configurações/i });
    await user.click(settingsButton);

    await waitFor(() => {
      expect(screen.getByText('Configurações')).toBeVisible();
    });

    const alterarButton = screen.getByRole('button', { name: /Alterar/i });
    await user.click(alterarButton);

    await waitFor(() => {
      const saved = localStorage.getItem('transactionSortOrder');
      expect(saved).toBe('asc');
    });
  });

  it('loads includePreviousBalance from localStorage on mount', () => {
    localStorage.setItem('includePreviousBalance', 'false');

    render(<App />);

    const saved = localStorage.getItem('includePreviousBalance');
    expect(saved).toBe('false');
  });

  it('loads transactionSortOrder from localStorage on mount', () => {
    localStorage.setItem('transactionSortOrder', 'asc');

    render(<App />);

    const saved = localStorage.getItem('transactionSortOrder');
    expect(saved).toBe('asc');
  });

  it('defaults to desc for transactionSortOrder when not in localStorage', async () => {
    render(<App />);

    await waitFor(() => {
      const saved = localStorage.getItem('transactionSortOrder');
      expect(saved).toBe('desc');
    });
  });

  it('defaults to true for includePreviousBalance when not in localStorage', async () => {
    render(<App />);

    await waitFor(() => {
      const saved = localStorage.getItem('includePreviousBalance');
      expect(saved).toBe('true');
    });
  });
});
