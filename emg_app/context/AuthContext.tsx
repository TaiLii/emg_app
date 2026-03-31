import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const USERS_KEY = '@emg_auth_users';
const SESSION_KEY = '@emg_auth_session';

interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}

interface SessionUser {
  id: string;
  name: string;
  email: string;
}

interface AuthContextValue {
  user: SessionUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function hashPassword(password: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password);
}

async function getUsers(): Promise<StoredUser[]> {
  const raw = await AsyncStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function saveUsers(users: StoredUser[]): Promise<void> {
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SESSION_KEY);
        if (raw) setUser(JSON.parse(raw));
      } catch {
        // ignore corrupt storage
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const users = await getUsers();
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!found) throw new Error('No account found with that email.');
    const hash = await hashPassword(password);
    if (hash !== found.passwordHash) throw new Error('Incorrect password.');
    const session: SessionUser = { id: found.id, name: found.name, email: found.email };
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const users = await getUsers();
    const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (exists) throw new Error('An account with that email already exists.');
    const passwordHash = await hashPassword(password);
    const newUser: StoredUser = {
      id: Date.now().toString(),
      name: name.trim(),
      email: email.trim(),
      passwordHash,
    };
    await saveUsers([...users, newUser]);
    const session: SessionUser = { id: newUser.id, name: newUser.name, email: newUser.email };
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session);
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
