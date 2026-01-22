/**
 * Enhanced Authentication Context
 * - Proper token management
 * - Better error handling
 * - Session restoration
 */

import * as db from '@/utils/database-enhanced';
import React, { createContext, useCallback, useEffect, useState } from 'react';
import { User, AuthToken } from '@/types';
import { validateEmail, validatePassword, validateUsername } from '@/utils/auth-utils';

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isSignedIn: boolean;
  tokens: AuthToken | null;
  error: string | null;

  signUp: (username: string, email: string, password: string) => Promise<void>;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  restoreSession: () => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState({
    isLoading: true,
    isSignedIn: false,
    user: null as User | null,
    tokens: null as AuthToken | null,
    error: null as string | null,
  });

  const restoreSession = useCallback(async () => {
    try {
      await db.initializeDatabase();
      const session = await db.getSession();

      if (session && session.userId && session.accessToken) {
        const user = await db.getUserById(session.userId);
        setState({
          isLoading: false,
          isSignedIn: true,
          user,
          tokens: {
            accessToken: session.accessToken,
            refreshToken: session.refreshToken,
            expiresAt: Date.now() + 3600000, // 1 hour
            issuedAt: Date.now(),
          },
          error: null,
        });
      } else {
        setState({
          isLoading: false,
          isSignedIn: false,
          user: null,
          tokens: null,
          error: null,
        });
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
      setState({
        isLoading: false,
        isSignedIn: false,
        user: null,
        tokens: null,
        error: 'Failed to restore session',
      });
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const signUp = useCallback(
    async (username: string, email: string, password: string) => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        // Validation
        const usernameValidation = validateUsername(username);
        if (!usernameValidation.valid) {
          throw new Error(usernameValidation.errors[0]);
        }

        if (!validateEmail(email)) {
          throw new Error('Invalid email format');
        }

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
          throw new Error(passwordValidation.errors[0]);
        }

        // Create user
        const result = await db.createUser(username, email, password);

        // Save session
        await db.saveSession(result.user.id, {
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
        });

        setState({
          isLoading: false,
          isSignedIn: true,
          user: result.user,
          tokens: {
            accessToken: result.tokens.accessToken,
            refreshToken: result.tokens.refreshToken,
            expiresAt: Date.now() + 3600000,
            issuedAt: Date.now(),
          },
          error: null,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Sign up failed';
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: message,
        }));
        throw error;
      }
    },
    []
  );

  const signIn = useCallback(async (username: string, password: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      if (!username || !password) {
        throw new Error('Username and password are required');
      }

      console.log('[Auth] Starting signIn for:', username);
      const result = await db.authenticateUser(username, password);
      console.log('[Auth] User authenticated:', result.user.id);

      await db.saveSession(result.user.id, {
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
      });
      console.log('[Auth] Session saved');

      setState({
        isLoading: false,
        isSignedIn: true,
        user: result.user,
        tokens: {
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
          expiresAt: Date.now() + 3600000,
          issuedAt: Date.now(),
        },
        error: null,
      });
      console.log('[Auth] SignIn complete');
    } catch (error) {
      console.error('[Auth] SignIn error:', error);
      const message = error instanceof Error ? error.message : 'Sign in failed';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      console.log('[Auth] SignOut called');
      await db.clearSession();
      console.log('[Auth] Session cleared');
      setState({
        isLoading: false,
        isSignedIn: false,
        user: null,
        tokens: null,
        error: null,
      });
      console.log('[Auth] State reset to signed out');
    } catch (error) {
      console.error('[Auth] Error signing out:', error);
      setState((prev) => ({
        ...prev,
        error: 'Failed to sign out',
      }));
    }
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const value: AuthContextType = {
    user: state.user,
    isLoading: state.isLoading,
    isSignedIn: state.isSignedIn,
    tokens: state.tokens,
    error: state.error,
    signUp,
    signIn,
    signOut,
    restoreSession,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
