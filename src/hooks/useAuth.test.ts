import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from './useAuth';
import { AuthService } from '../services/authService';

vi.mock('../services/authService');

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('starts with loading state', () => {
      vi.mocked(AuthService.onAuthStateChanged).mockReturnValue(() => {});

      const { result } = renderHook(() => useAuth());

      expect(result.current.loading).toBe(true);
      expect(result.current.user).toBeNull();
    });

    it('sets user when authenticated', async () => {
      const mockUser = {
        uid: 'user1',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
      };

      vi.mocked(AuthService.onAuthStateChanged).mockImplementation((callback) => {
        setTimeout(() => callback(mockUser), 0);
        return () => {};
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.user).toEqual(mockUser);
      });
    });

    it('sets loading to false when no user', async () => {
      vi.mocked(AuthService.onAuthStateChanged).mockImplementation((callback) => {
        setTimeout(() => callback(null), 0);
        return () => {};
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.user).toBeNull();
      });
    });
  });

  describe('signInWithGoogle', () => {
    it('calls AuthService.signInWithGoogle', async () => {
      vi.mocked(AuthService.onAuthStateChanged).mockReturnValue(() => {});
      vi.mocked(AuthService.signInWithGoogle).mockResolvedValue({
        uid: 'user1',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: null,
      });

      const { result } = renderHook(() => useAuth());

      await result.current.signInWithGoogle();

      expect(AuthService.signInWithGoogle).toHaveBeenCalled();
    });

    it('sets error on sign in failure', async () => {
      vi.mocked(AuthService.onAuthStateChanged).mockReturnValue(() => {});
      vi.mocked(AuthService.signInWithGoogle).mockRejectedValue(new Error('Sign in failed'));

      const { result } = renderHook(() => useAuth());

      await result.current.signInWithGoogle();

      await waitFor(() => {
        expect(result.current.error).toBe('Sign in failed');
      });
    });
  });

  describe('signInWithEmail', () => {
    it('calls AuthService.signInWithEmail with credentials', async () => {
      vi.mocked(AuthService.onAuthStateChanged).mockReturnValue(() => {});
      vi.mocked(AuthService.signInWithEmail).mockResolvedValue({
        uid: 'user1',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: null,
      });

      const { result } = renderHook(() => useAuth());

      await result.current.signInWithEmail('test@example.com', 'password123');

      expect(AuthService.signInWithEmail).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    it('sets error and throws on failure', async () => {
      vi.mocked(AuthService.onAuthStateChanged).mockReturnValue(() => {});
      vi.mocked(AuthService.signInWithEmail).mockRejectedValue(new Error('Invalid credentials'));

      const { result } = renderHook(() => useAuth());

      await expect(result.current.signInWithEmail('test@example.com', 'wrong')).rejects.toThrow();

      await waitFor(() => {
        expect(result.current.error).toBe('Invalid credentials');
      });
    });
  });

  describe('signUpWithEmail', () => {
    it('calls AuthService.signUpWithEmail with credentials', async () => {
      vi.mocked(AuthService.onAuthStateChanged).mockReturnValue(() => {});
      vi.mocked(AuthService.signUpWithEmail).mockResolvedValue({
        uid: 'user1',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: null,
      });

      const { result } = renderHook(() => useAuth());

      await result.current.signUpWithEmail('test@example.com', 'password123', 'Test User');

      expect(AuthService.signUpWithEmail).toHaveBeenCalledWith('test@example.com', 'password123', 'Test User');
    });
  });

  describe('signOut', () => {
    it('calls AuthService.signOut', async () => {
      vi.mocked(AuthService.onAuthStateChanged).mockReturnValue(() => {});
      vi.mocked(AuthService.signOut).mockResolvedValue();

      const { result } = renderHook(() => useAuth());

      await result.current.signOut();

      expect(AuthService.signOut).toHaveBeenCalled();
    });

    it('sets error on sign out failure', async () => {
      vi.mocked(AuthService.onAuthStateChanged).mockReturnValue(() => {});
      vi.mocked(AuthService.signOut).mockRejectedValue(new Error('Sign out failed'));

      const { result } = renderHook(() => useAuth());

      await result.current.signOut();

      await waitFor(() => {
        expect(result.current.error).toBe('Sign out failed');
      });
    });
  });

  describe('cleanup', () => {
    it('unsubscribes on unmount', () => {
      const unsubscribe = vi.fn();
      vi.mocked(AuthService.onAuthStateChanged).mockReturnValue(unsubscribe);

      const { unmount } = renderHook(() => useAuth());

      unmount();

      expect(unsubscribe).toHaveBeenCalled();
    });
  });
});
