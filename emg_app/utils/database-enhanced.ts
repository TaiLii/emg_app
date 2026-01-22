/**
 * Enhanced Database Layer
 * - Improved EMG schema with sessions
 * - Better query capabilities
 * - Error handling and recovery
 */

import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { User, EMGSession, EMGSample, EMGBatch, SessionStatistics, DBError } from '@/types';
import {
  hashPassword,
  verifyPassword,
  generateId,
  generateAccessToken,
  generateRefreshToken,
} from './auth-utils';

const DB_DIR = `${FileSystem.documentDirectory}emg_db_v2`;
const USERS_FILE = `${DB_DIR}/users.json`;
const SESSIONS_FILE = `${DB_DIR}/sessions.json`;
const SAMPLES_FILE = `${DB_DIR}/samples.json`;
const STATS_FILE = `${DB_DIR}/statistics.json`;
const IS_WEB = Platform.OS === 'web';

const WEB_USERS_KEY = 'emg_users_v2';
const WEB_SESSIONS_KEY = 'emg_sessions_v2';
const WEB_SAMPLES_KEY = 'emg_samples_v2';
const WEB_STATS_KEY = 'emg_stats_v2';
const OLD_WEB_USERS_KEY = 'emg_users'; // For migration

interface StoredUser extends User {
  refreshToken?: string;
  lastLogin?: string;
  accessTokenExpiry?: number;
}

// ==================== DATABASE INITIALIZATION ====================

export const initializeDatabase = async () => {
  try {
    if (IS_WEB) {
      // Initialize localStorage on web
      if (!localStorage.getItem(WEB_USERS_KEY)) {
        localStorage.setItem(WEB_USERS_KEY, JSON.stringify([]));
      }
      if (!localStorage.getItem(WEB_SESSIONS_KEY)) {
        localStorage.setItem(WEB_SESSIONS_KEY, JSON.stringify([]));
      }
      if (!localStorage.getItem(WEB_SAMPLES_KEY)) {
        localStorage.setItem(WEB_SAMPLES_KEY, JSON.stringify([]));
      }
      if (!localStorage.getItem(WEB_STATS_KEY)) {
        localStorage.setItem(WEB_STATS_KEY, JSON.stringify([]));
      }
      
      // Migrate old users if they exist
      await migrateOldUsers();
    } else {
      // Initialize FileSystem on mobile
      const dirInfo = await FileSystem.getInfoAsync(DB_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(DB_DIR, { intermediates: true });
      }

      for (const file of [USERS_FILE, SESSIONS_FILE, SAMPLES_FILE, STATS_FILE]) {
        const fileInfo = await FileSystem.getInfoAsync(file);
        if (!fileInfo.exists) {
          await FileSystem.writeAsStringAsync(file, JSON.stringify([]), { encoding: 'utf8' });
        }
      }
    }
  } catch (error) {
    throw createError('DB_INIT_FAILED', 'Failed to initialize database', error);
  }
};

// Migrate users from old database format
const migrateOldUsers = async () => {
  try {
    if (!IS_WEB) return;
    
    const oldUsersRaw = localStorage.getItem(OLD_WEB_USERS_KEY);
    if (!oldUsersRaw) return;
    
    const oldData = JSON.parse(oldUsersRaw);
    const oldUsers = oldData.users || oldData || [];
    
    if (!Array.isArray(oldUsers) || oldUsers.length === 0) return;
    
    const newUsers = await readUsers();
    let migrated = 0;
    
    for (const oldUser of oldUsers) {
      // Check if already migrated
      const exists = newUsers.some(u => u.username === oldUser.username || u.email === oldUser.email);
      if (exists) continue;
      
      // Migrate user with new fields
      const migratedUser: StoredUser = {
        id: oldUser.id || generateId('user'),
        username: oldUser.username,
        email: oldUser.email,
        passwordHash: oldUser.passwordHash,
        createdAt: oldUser.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        emailVerified: false,
        twoFactorEnabled: false,
      };
      
      newUsers.push(migratedUser);
      migrated++;
    }
    
    if (migrated > 0) {
      await writeUsers(newUsers);
      console.log(`[DB] Migrated ${migrated} users from old database`);
    }
  } catch (error) {
    console.error('[DB] Migration error:', error);
  }
};

// ==================== USER MANAGEMENT ====================

export const createUser = async (
  username: string,
  email: string,
  password: string
): Promise<{ user: User; tokens: { accessToken: string; refreshToken: string } }> => {
  try {
    await initializeDatabase();

    // Validation
    if (!username || !email || !password) {
      throw createError('VALIDATION_ERROR', 'Username, email, and password are required');
    }

    // Check for duplicates
    const users = await readUsers();
    if (users.some((u) => u.username === username || u.email === email)) {
      throw createError('USER_EXISTS', 'Username or email already registered');
    }

    // Create new user
    const passwordHash = await hashPassword(password);
    const newUser: StoredUser = {
      id: generateId('user'),
      username,
      email,
      passwordHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      emailVerified: false,
      twoFactorEnabled: false,
    };

    const { token: accessToken, expiresAt: accessExpiry } = generateAccessToken(newUser.id);
    const refreshToken = generateRefreshToken(newUser.id);

    newUser.refreshToken = refreshToken;
    newUser.accessTokenExpiry = accessExpiry;
    newUser.lastLogin = new Date().toISOString();

    users.push(newUser);
    await writeUsers(users);

    // Return user without sensitive data
    const { passwordHash: _, refreshToken: __, ...safeUser } = newUser;
    return {
      user: safeUser,
      tokens: { accessToken, refreshToken },
    };
  } catch (error) {
    if (error instanceof Error && (error as any).code) {
      throw error;
    }
    throw createError('USER_CREATE_FAILED', 'Failed to create user', error);
  }
};

export const authenticateUser = async (
  username: string,
  password: string
): Promise<{ user: User; tokens: { accessToken: string; refreshToken: string } }> => {
  try {
    console.log('[DB] authenticateUser called with username:', username);
    await initializeDatabase();

    const users = await readUsers();
    console.log('[DB] Total users in DB:', users.length);
    console.log('[DB] Usernames in DB:', users.map(u => u.username));
    const user = users.find((u) => u.username === username);

    if (!user) {
      console.log('[DB] User not found:', username);
      throw createError('AUTH_FAILED', 'Invalid credentials');
    }

    console.log('[DB] User found, verifying password');
    const isValid = await verifyPassword(password, user.passwordHash);
    console.log('[DB] Password valid:', isValid);
    
    if (!isValid) {
      console.log('[DB] Password verification failed');
      throw createError('AUTH_FAILED', 'Invalid credentials');
    }

    // Generate tokens
    const { token: accessToken, expiresAt: accessExpiry } = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Update user
    user.refreshToken = refreshToken;
    user.accessTokenExpiry = accessExpiry;
    user.lastLogin = new Date().toISOString();
    user.updatedAt = new Date().toISOString();

    await writeUsers(users);
    console.log('[DB] User tokens generated and user updated');

    const { passwordHash: _, refreshToken: __, ...safeUser } = user;
    return {
      user: safeUser,
      tokens: { accessToken, refreshToken },
    };
  } catch (error) {
    console.error('[DB] authenticateUser error:', error);
    if (error instanceof Error && (error as any).code) {
      throw error;
    }
    throw createError('AUTH_FAILED', 'Authentication failed', error);
  }
};

export const getUserById = async (userId: string): Promise<User> => {
  try {
    const users = await readUsers();
    const user = users.find((u) => u.id === userId);

    if (!user) {
      throw createError('USER_NOT_FOUND', 'User not found');
    }

    const { passwordHash: _, refreshToken: __, ...safeUser } = user;
    return safeUser;
  } catch (error) {
    if (error instanceof Error && (error as any).code) {
      throw error;
    }
    throw createError('USER_FETCH_FAILED', 'Failed to fetch user', error);
  }
};

export const updateUser = async (
  userId: string,
  updates: Partial<User>
): Promise<User> => {
  try {
    const users = await readUsers();
    const userIndex = users.findIndex((u) => u.id === userId);

    if (userIndex === -1) {
      throw createError('USER_NOT_FOUND', 'User not found');
    }

    users[userIndex] = {
      ...users[userIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await writeUsers(users);

    const { passwordHash: _, refreshToken: __, ...safeUser } = users[userIndex];
    return safeUser;
  } catch (error) {
    if (error instanceof Error && (error as any).code) {
      throw error;
    }
    throw createError('USER_UPDATE_FAILED', 'Failed to update user', error);
  }
};

// ==================== EMG SESSION MANAGEMENT ====================

export const createEMGSession = async (
  userId: string,
  sessionData: Omit<EMGSession, 'id' | 'userId' | 'startedAt'>
): Promise<EMGSession> => {
  try {
    await initializeDatabase();

    const session: EMGSession = {
      id: generateId('session'),
      userId,
      ...sessionData,
      startedAt: new Date().toISOString(),
    };

    const sessions = await readSessions();
    sessions.push(session);
    await writeSessions(sessions);

    return session;
  } catch (error) {
    throw createError('SESSION_CREATE_FAILED', 'Failed to create EMG session', error);
  }
};

export const endEMGSession = async (sessionId: string): Promise<EMGSession> => {
  try {
    const sessions = await readSessions();
    const session = sessions.find((s) => s.id === sessionId);

    if (!session) {
      throw createError('SESSION_NOT_FOUND', 'Session not found');
    }

    session.endedAt = new Date().toISOString();
    await writeSessions(sessions);

    return session;
  } catch (error) {
    if (error instanceof Error && (error as any).code) {
      throw error;
    }
    throw createError('SESSION_END_FAILED', 'Failed to end EMG session', error);
  }
};

export const getUserSessions = async (userId: string): Promise<EMGSession[]> => {
  try {
    const sessions = await readSessions();
    return sessions.filter((s) => s.userId === userId).sort((a, b) => 
      new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  } catch (error) {
    throw createError('SESSIONS_FETCH_FAILED', 'Failed to fetch sessions', error);
  }
};

export const getSessionById = async (sessionId: string): Promise<EMGSession> => {
  try {
    const sessions = await readSessions();
    const session = sessions.find((s) => s.id === sessionId);

    if (!session) {
      throw createError('SESSION_NOT_FOUND', 'Session not found');
    }

    return session;
  } catch (error) {
    if (error instanceof Error && (error as any).code) {
      throw error;
    }
    throw createError('SESSION_FETCH_FAILED', 'Failed to fetch session', error);
  }
};

// ==================== EMG SAMPLE MANAGEMENT ====================

export const addEMGSample = async (
  sessionId: string,
  userId: string,
  sampleData: Omit<EMGSample, 'id' | 'sessionId' | 'userId'>
): Promise<EMGSample> => {
  try {
    const sample: EMGSample = {
      id: generateId('sample'),
      sessionId,
      userId,
      ...sampleData,
    };

    const samples = await readSamples();
    samples.push(sample);
    await writeSamples(samples);

    return sample;
  } catch (error) {
    throw createError('SAMPLE_ADD_FAILED', 'Failed to add EMG sample', error);
  }
};

export const getSessionSamples = async (sessionId: string): Promise<EMGSample[]> => {
  try {
    const samples = await readSamples();
    return samples
      .filter((s) => s.sessionId === sessionId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  } catch (error) {
    throw createError('SAMPLES_FETCH_FAILED', 'Failed to fetch samples', error);
  }
};

export const addEMGBatch = async (batchData: Omit<EMGBatch, 'id'>): Promise<EMGBatch> => {
  try {
    const batch: EMGBatch = {
      id: generateId('batch'),
      ...batchData,
    };

    // Add all samples in batch
    for (const sample of batch.samples) {
      await addEMGSample(batch.sessionId, batch.userId, {
        timestamp: sample.timestamp,
        sampleNumber: sample.sampleNumber,
        channels: sample.channels,
        processed: sample.processed,
      });
    }

    return batch;
  } catch (error) {
    throw createError('BATCH_ADD_FAILED', 'Failed to add EMG batch', error);
  }
};

// ==================== STATISTICS ====================

export const calculateSessionStatistics = async (
  sessionId: string
): Promise<SessionStatistics> => {
  try {
    const samples = await getSessionSamples(sessionId);
    const session = await getSessionById(sessionId);

    if (samples.length === 0) {
      throw createError('NO_DATA', 'No samples found for session');
    }

    const channelCount = session.channelCount;
    const channelRMS: number[] = Array(channelCount).fill(0);
    const channelMin: number[] = Array(channelCount).fill(Infinity);
    const channelMax: number[] = Array(channelCount).fill(-Infinity);

    // Calculate statistics
    for (const sample of samples) {
      for (let i = 0; i < Math.min(sample.channels.length, channelCount); i++) {
        const value = Math.abs(sample.channels[i]); // Use absolute value for RMS
        channelRMS[i] += value * value;
        channelMin[i] = Math.min(channelMin[i], sample.channels[i]);
        channelMax[i] = Math.max(channelMax[i], sample.channels[i]);
      }
    }

    // Compute RMS
    const averageRMS = channelRMS.map((sum) => Math.sqrt(sum / samples.length));

    const stats: SessionStatistics = {
      sessionId,
      userId: session.userId,
      totalSamples: samples.length,
      duration: session.duration,
      averageRMS,
      peakValues: channelMax,
      minValues: channelMin,
      maxValues: channelMax,
      signalQuality: 85, // Placeholder
    };

    const allStats = await readStatistics();
    allStats.push(stats);
    await writeStatistics(allStats);

    return stats;
  } catch (error) {
    if (error instanceof Error && (error as any).code) {
      throw error;
    }
    throw createError('STATS_CALC_FAILED', 'Failed to calculate statistics', error);
  }
};

export const getSessionStatistics = async (
  sessionId: string
): Promise<SessionStatistics | null> => {
  try {
    const stats = await readStatistics();
    return stats.find((s) => s.sessionId === sessionId) || null;
  } catch (error) {
    throw createError('STATS_FETCH_FAILED', 'Failed to fetch statistics', error);
  }
};

// ==================== FILE I/O ====================

const readUsers = async (): Promise<StoredUser[]> => {
  try {
    if (IS_WEB) {
      return JSON.parse(localStorage.getItem(WEB_USERS_KEY) || '[]');
    }
    const content = await FileSystem.readAsStringAsync(USERS_FILE, { encoding: 'utf8' });
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading users:', error);
    return [];
  }
};

const readSessions = async (): Promise<EMGSession[]> => {
  try {
    if (IS_WEB) {
      return JSON.parse(localStorage.getItem(WEB_SESSIONS_KEY) || '[]');
    }
    const content = await FileSystem.readAsStringAsync(SESSIONS_FILE, { encoding: 'utf8' });
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading sessions:', error);
    return [];
  }
};

const readSamples = async (): Promise<EMGSample[]> => {
  try {
    if (IS_WEB) {
      return JSON.parse(localStorage.getItem(WEB_SAMPLES_KEY) || '[]');
    }
    const content = await FileSystem.readAsStringAsync(SAMPLES_FILE, { encoding: 'utf8' });
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading samples:', error);
    return [];
  }
};

const readStatistics = async (): Promise<SessionStatistics[]> => {
  try {
    if (IS_WEB) {
      return JSON.parse(localStorage.getItem(WEB_STATS_KEY) || '[]');
    }
    const content = await FileSystem.readAsStringAsync(STATS_FILE, { encoding: 'utf8' });
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading statistics:', error);
    return [];
  }
};

const writeUsers = async (users: StoredUser[]) => {
  try {
    if (IS_WEB) {
      localStorage.setItem(WEB_USERS_KEY, JSON.stringify(users));
    } else {
      await FileSystem.writeAsStringAsync(USERS_FILE, JSON.stringify(users, null, 2), {
        encoding: 'utf8',
      });
    }
  } catch (error) {
    throw createError('WRITE_FAILED', 'Failed to write users', error);
  }
};

const writeSessions = async (sessions: EMGSession[]) => {
  try {
    if (IS_WEB) {
      localStorage.setItem(WEB_SESSIONS_KEY, JSON.stringify(sessions));
    } else {
      await FileSystem.writeAsStringAsync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), {
        encoding: 'utf8',
      });
    }
  } catch (error) {
    throw createError('WRITE_FAILED', 'Failed to write sessions', error);
  }
};

const writeSamples = async (samples: EMGSample[]) => {
  try {
    if (IS_WEB) {
      localStorage.setItem(WEB_SAMPLES_KEY, JSON.stringify(samples));
    } else {
      await FileSystem.writeAsStringAsync(SAMPLES_FILE, JSON.stringify(samples, null, 2), {
        encoding: 'utf8',
      });
    }
  } catch (error) {
    throw createError('WRITE_FAILED', 'Failed to write samples', error);
  }
};

const writeStatistics = async (stats: SessionStatistics[]) => {
  try {
    if (IS_WEB) {
      localStorage.setItem(WEB_STATS_KEY, JSON.stringify(stats));
    } else {
      await FileSystem.writeAsStringAsync(STATS_FILE, JSON.stringify(stats, null, 2), {
        encoding: 'utf8',
      });
    }
  } catch (error) {
    throw createError('WRITE_FAILED', 'Failed to write statistics', error);
  }
};

// ==================== SESSION PERSISTENCE ====================

const SESSION_KEY = 'emg_auth_session';

export const saveSession = async (userId: string, tokens: { accessToken: string; refreshToken: string }) => {
  try {
    const sessionData = {
      userId,
      ...tokens,
      savedAt: Date.now(),
    };

    if (IS_WEB) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    } else {
      await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(sessionData));
    }
  } catch (error) {
    console.error('Error saving session:', error);
  }
};

export const getSession = async (): Promise<{ userId: string; accessToken: string; refreshToken: string } | null> => {
  try {
    if (IS_WEB) {
      const data = localStorage.getItem(SESSION_KEY);
      return data ? JSON.parse(data) : null;
    } else {
      const data = await SecureStore.getItemAsync(SESSION_KEY);
      return data ? JSON.parse(data) : null;
    }
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
};

export const clearSession = async () => {
  try {
    if (IS_WEB) {
      localStorage.removeItem(SESSION_KEY);
    } else {
      await SecureStore.deleteItemAsync(SESSION_KEY);
    }
  } catch (error) {
    console.error('Error clearing session:', error);
  }
};

// ==================== ERROR HANDLING ====================

const createError = (code: string, message: string, originalError?: any): DBError => {
  return {
    code,
    message,
    originalError: originalError instanceof Error ? originalError : new Error(String(originalError)),
    timestamp: new Date().toISOString(),
  };
};

export { DBError };
