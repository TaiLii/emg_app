import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const DB_DIR = `${FileSystem.documentDirectory}emg_db`;
const USERS_FILE = `${DB_DIR}/users.json`;
const DATA_FILE = `${DB_DIR}/data.json`;
const IS_WEB = Platform.OS === 'web';

const WEB_USERS_KEY = 'emg_users';
const WEB_DATA_KEY = 'emg_data';

interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

interface EMGData {
  id: string;
  userId: string;
  values: number[];
  muscleGroup: string;
  timestamp: string;
}

interface Database {
  users: User[];
  data: EMGData[];
}

// Initialize database
export const initializeDatabase = async () => {
  try {
    if (IS_WEB) {
      // Use localStorage on web
      try {
        if (!localStorage.getItem(WEB_USERS_KEY)) {
          localStorage.setItem(WEB_USERS_KEY, JSON.stringify({ users: [] }));
        }
        if (!localStorage.getItem(WEB_DATA_KEY)) {
          localStorage.setItem(WEB_DATA_KEY, JSON.stringify({ data: [] }));
        }
      } catch (e) {
        console.error('localStorage not available:', e);
      }
    } else {
      const dirInfo = await FileSystem.getInfoAsync(DB_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(DB_DIR, { intermediates: true });
      }

      // Initialize users file
      const usersInfo = await FileSystem.getInfoAsync(USERS_FILE);
      if (!usersInfo.exists) {
        await FileSystem.writeAsStringAsync(USERS_FILE, JSON.stringify({ users: [] }, null, 2));
      }

      // Initialize data file
      const dataInfo = await FileSystem.getInfoAsync(DATA_FILE);
      if (!dataInfo.exists) {
        await FileSystem.writeAsStringAsync(DATA_FILE, JSON.stringify({ data: [] }, null, 2));
      }
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

// User Management Functions

export const createUser = async (username: string, email: string, password: string) => {
  try {
    // Ensure database storage is initialized before any read/write
    await initializeDatabase();
    console.log('Creating user:', username);
    const users = await readUsers();
    
    // Check if user already exists
    if (users.some(u => u.username === username || u.email === email)) {
      throw new Error('Username or email already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(password);
    console.log('Password hashed');
    
    const newUser: User = {
      id: generateId(),
      username,
      email,
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    await writeUsers(users);
    console.log('User saved to storage');
    
    return { id: newUser.id, username: newUser.username, email: newUser.email };
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const authenticateUser = async (username: string, password: string) => {
  try {
    // Ensure database storage is initialized before any read/write
    await initializeDatabase();
    console.log('Authenticating user:', username);
    const users = await readUsers();
    console.log('Users found:', users.length);
    const user = users.find(u => u.username === username);

    if (!user) {
      console.log('No user found with username:', username);
      throw new Error('User not found');
    }

    console.log('User found, verifying password');
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      console.log('Password mismatch for user:', username);
      throw new Error('Incorrect password');
    }

    console.log('Password verified');
    return { id: user.id, username: user.username, email: user.email };
  } catch (error) {
    console.error('Error authenticating user:', error);
    throw error;
  }
};

export const getUserById = async (userId: string) => {
  try {
    const users = await readUsers();
    const user = users.find(u => u.id === userId);
    if (!user) {
      throw new Error('User not found');
    }
    return { id: user.id, username: user.username, email: user.email };
  } catch (error) {
    throw error;
  }
};

// EMG Data Functions

export const addEMGData = async (userId: string, values: number[], muscleGroup: string = 'General') => {
  try {
    const data = await readData();
    
    const newData: EMGData = {
      id: generateId(),
      userId,
      values,
      muscleGroup,
      timestamp: new Date().toISOString(),
    };

    data.push(newData);
    await writeData(data);
    
    return newData;
  } catch (error) {
    throw error;
  }
};

export const getUserEMGData = async (userId: string) => {
  try {
    const data = await readData();
    return data.filter(d => d.userId === userId);
  } catch (error) {
    throw error;
  }
};

export const getLatestEMGData = async (userId: string, limit: number = 10) => {
  try {
    const data = await readData();
    return data
      .filter(d => d.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  } catch (error) {
    throw error;
  }
};

// Helper Functions

const readUsers = async (): Promise<User[]> => {
  try {
    if (IS_WEB) {
      const content = localStorage.getItem(WEB_USERS_KEY) || '{"users":[]}';
      const parsed = JSON.parse(content);
      return parsed.users || [];
    }
    const content = await FileSystem.readAsStringAsync(USERS_FILE);
    const parsed = JSON.parse(content);
    return parsed.users || [];
  } catch (error) {
    console.error('Error reading users:', error);
    return [];
  }
};

const readData = async (): Promise<EMGData[]> => {
  try {
    if (IS_WEB) {
      const content = localStorage.getItem(WEB_DATA_KEY) || '{"data":[]}';
      const parsed = JSON.parse(content);
      return parsed.data || [];
    }
    const content = await FileSystem.readAsStringAsync(DATA_FILE);
    const parsed = JSON.parse(content);
    return parsed.data || [];
  } catch (error) {
    console.error('Error reading data:', error);
    return [];
  }
};

const writeUsers = async (users: User[]) => {
  try {
    if (IS_WEB) {
      localStorage.setItem(WEB_USERS_KEY, JSON.stringify({ users }));
      return;
    }
    await FileSystem.writeAsStringAsync(USERS_FILE, JSON.stringify({ users }, null, 2));
  } catch (error) {
    console.error('Error writing users:', error);
    throw error;
  }
};

const writeData = async (data: EMGData[]) => {
  try {
    if (IS_WEB) {
      localStorage.setItem(WEB_DATA_KEY, JSON.stringify({ data }));
      return;
    }
    await FileSystem.writeAsStringAsync(DATA_FILE, JSON.stringify({ data }, null, 2));
  } catch (error) {
    console.error('Error writing data:', error);
    throw error;
  }
};

const hashPassword = async (password: string): Promise<string> => {
  try {
    // Simple hash function that works in React Native
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    const salt = generateId().substring(0, 10);
    return `${salt}$${Math.abs(hash).toString(16)}`;
  } catch (error) {
    throw error;
  }
};

const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  try {
    const [salt, encodedHash] = hash.split('$');
    let computedHash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      computedHash = ((computedHash << 5) - computedHash) + char;
      computedHash = computedHash & computedHash;
    }
    return Math.abs(computedHash).toString(16) === encodedHash;
  } catch (error) {
    return false;
  }
};

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Session Management

const SESSION_KEY = 'emg_user_session';

export const saveSession = async (userId: string) => {
  try {
    if (IS_WEB) {
      try {
        localStorage.setItem(SESSION_KEY, userId);
      } catch (e) {
        console.error('localStorage not available for session:', e);
      }
      return;
    }
    await SecureStore.setItemAsync('userId', userId);
  } catch (error) {
    console.error('Error saving session:', error);
  }
};

export const getSession = async () => {
  try {
    if (IS_WEB) {
      try {
        return localStorage.getItem(SESSION_KEY);
      } catch (e) {
        console.error('localStorage not available for session:', e);
        return null;
      }
    }
    return await SecureStore.getItemAsync('userId');
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
};

export const clearSession = async () => {
  try {
    if (IS_WEB) {
      try {
        localStorage.removeItem(SESSION_KEY);
      } catch (e) {
        console.error('localStorage not available for session:', e);
      }
      return;
    }
    await SecureStore.deleteItemAsync('userId');
  } catch (error) {
    console.error('Error clearing session:', error);
  }
};
