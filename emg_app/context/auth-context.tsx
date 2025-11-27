import * as db from '@/utils/database';
import React, { createContext, useCallback, useEffect, useState } from 'react';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isSignedIn: boolean;
  signUp: (username: string, email: string, password: string) => Promise<void>;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  restoreToken: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useState({
    isLoading: true,
    isSignedIn: false,
    user: null as AuthUser | null,
  });

  // Restore token on app start
  const restoreToken = useCallback(async () => {
    try {
      await db.initializeDatabase();
      const userId = await db.getSession();
      
      if (userId) {
        const user = await db.getUserById(userId);
        dispatch({
          isLoading: false,
          isSignedIn: true,
          user,
        });
      } else {
        dispatch({
          isLoading: false,
          isSignedIn: false,
          user: null,
        });
      }
    } catch (e) {
      console.error('Failed to restore token:', e);
      dispatch({
        isLoading: false,
        isSignedIn: false,
        user: null,
      });
    }
  }, []);

  useEffect(() => {
    restoreToken();
  }, [restoreToken]);

  const signUp = useCallback(async (username: string, email: string, password: string) => {
    try {
      console.log('Starting signup for:', username);
      const user = await db.createUser(username, email, password);
      console.log('User created:', user);
      await db.saveSession(user.id);
      console.log('Session saved');
      dispatch({
        isLoading: false,
        isSignedIn: true,
        user,
      });
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }, []);

  const signIn = useCallback(async (username: string, password: string) => {
    try {
      console.log('Starting signin for:', username);
      const user = await db.authenticateUser(username, password);
      console.log('User authenticated:', user);
      await db.saveSession(user.id);
      console.log('Session saved');
      dispatch({
        isLoading: false,
        isSignedIn: true,
        user,
      });
    } catch (error) {
      console.error('Signin error:', error);
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      console.log('Auth: signOut called');
      await db.clearSession();
      console.log('Auth: session cleared');
      dispatch({
        isLoading: false,
        isSignedIn: false,
        user: null,
      });
      console.log('Auth: state updated to signed out');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, []);

  const value = {
    user: state.user,
    isLoading: state.isLoading,
    isSignedIn: state.isSignedIn,
    signUp,
    signIn,
    signOut,
    restoreToken,
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
