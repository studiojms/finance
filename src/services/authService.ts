import { User as FirebaseUser } from 'firebase/auth';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { isFirebase, isSupabase } from '../config';
import { auth as firebaseAuth } from '../firebase';
import { supabase } from '../supabase';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
}

export class AuthService {
  static getCurrentUser(): Promise<AuthUser | null> {
    return new Promise((resolve) => {
      if (isFirebase()) {
        const unsubscribe = firebaseAuth?.onAuthStateChanged((user: FirebaseUser | null) => {
          unsubscribe();
          if (user) {
            resolve({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
            });
          } else {
            resolve(null);
          }
        });
      } else if (isSupabase()) {
        supabase?.auth.getUser().then(({ data }) => {
          if (data?.user) {
            resolve({
              uid: data.user.id,
              email: data.user.email || null,
              displayName: data.user.user_metadata?.display_name || null,
              photoURL: data.user.user_metadata?.avatar_url || null,
            });
          } else {
            resolve(null);
          }
        });
      } else {
        resolve(null);
      }
    });
  }

  static onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    console.log(
      'AuthService.onAuthStateChanged called, backend:',
      isFirebase() ? 'firebase' : isSupabase() ? 'supabase' : 'none'
    );

    if (isFirebase()) {
      if (!firebaseAuth) {
        console.warn('Firebase backend selected but firebaseAuth is not initialized');
        callback(null);
        return () => {};
      }

      return firebaseAuth.onAuthStateChanged((user: FirebaseUser | null) => {
        if (user) {
          callback({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
          });
        } else {
          callback(null);
        }
      });
    } else if (isSupabase()) {
      if (!supabase) {
        console.warn('Supabase backend selected but supabase client is not initialized');
        callback(null);
        return () => {};
      }

      // Check current session immediately
      supabase.auth
        .getSession()
        .then(({ data: { session }, error }) => {
          if (error) {
            console.error('Supabase getSession error:', error);
            callback(null);
            return;
          }

          if (session?.user) {
            console.log('Supabase: Found existing session for', session.user.email);
            callback({
              uid: session.user.id,
              email: session.user.email || null,
              displayName: session.user.user_metadata?.display_name || null,
              photoURL: session.user.user_metadata?.avatar_url || null,
            });
          } else {
            console.log('Supabase: No existing session');
            callback(null);
          }
        })
        .catch((err) => {
          console.error('Supabase getSession exception:', err);
          callback(null);
        });

      // Listen for future changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        console.log('Supabase auth state change:', event, session?.user?.email || 'no user');
        if (session?.user) {
          callback({
            uid: session.user.id,
            email: session.user.email || null,
            displayName: session.user.user_metadata?.display_name || null,
            photoURL: session.user.user_metadata?.avatar_url || null,
          });
        } else {
          callback(null);
        }
      });
      return () => subscription?.unsubscribe();
    }

    // Fallback: call with null immediately if no backend configured
    console.warn('No auth backend configured or initialized properly');
    callback(null);
    return () => {};
  }

  static async signInWithEmail(email: string, password: string): Promise<AuthUser> {
    if (isFirebase()) {
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const result = await signInWithEmailAndPassword(firebaseAuth!, email, password);
      return {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
      };
    } else if (isSupabase()) {
      const { data, error } = await supabase!.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return {
        uid: data.user!.id,
        email: data.user!.email || null,
        displayName: data.user!.user_metadata?.display_name || null,
        photoURL: data.user!.user_metadata?.avatar_url || null,
      };
    }
    throw new Error('No authentication backend configured');
  }

  static async signUpWithEmail(email: string, password: string, displayName?: string): Promise<AuthUser> {
    if (isFirebase()) {
      const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
      const result = await createUserWithEmailAndPassword(firebaseAuth!, email, password);
      if (displayName) {
        await updateProfile(result.user, { displayName });
      }
      return {
        uid: result.user.uid,
        email: result.user.email,
        displayName: displayName || result.user.displayName,
        photoURL: result.user.photoURL,
      };
    } else if (isSupabase()) {
      const { data, error } = await supabase!.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
        },
      });
      if (error) throw error;
      return {
        uid: data.user!.id,
        email: data.user!.email || null,
        displayName: displayName || null,
      };
    }
    throw new Error('No authentication backend configured');
  }

  static async signInWithGoogle(): Promise<AuthUser> {
    if (isFirebase()) {
      const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(firebaseAuth!, provider);
      return {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
      };
    } else if (isSupabase()) {
      const { error } = await supabase!.auth.signInWithOAuth({
        provider: 'google',
      });
      if (error) throw error;
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Failed to get user after OAuth');
      return user;
    }
    throw new Error('No authentication backend configured');
  }

  static async signOut(): Promise<void> {
    if (isFirebase()) {
      const { signOut } = await import('firebase/auth');
      await signOut(firebaseAuth!);
    } else if (isSupabase()) {
      await supabase!.auth.signOut();
    }
  }
}
