import { useState, useEffect } from 'react';
import { AuthService, AuthUser } from '../services/authService';

export interface UseAuthReturn {
  user: AuthUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged((authUser) => {
      setUser(authUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      setError(null);
      await AuthService.signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
      console.error('Sign in error:', err);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setError(null);
      await AuthService.signInWithEmail(email, password);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
      console.error('Sign in error:', err);
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
    try {
      setError(null);
      await AuthService.signUpWithEmail(email, password, displayName);
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
      console.error('Sign up error:', err);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await AuthService.signOut();
    } catch (err: any) {
      setError(err.message || 'Failed to sign out');
      console.error('Sign out error:', err);
    }
  };

  return {
    user,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    error,
  };
}
