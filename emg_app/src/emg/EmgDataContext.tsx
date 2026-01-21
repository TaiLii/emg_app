import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type EMGRow = {
  timestamp: string; // ISO preferred, but we’ll parse what you have
  muscle: string;
  value: number;
};

type EmgContextValue = {
  data: EMGRow[];
  setDataAndPersist: (rows: EMGRow[]) => Promise<void>;
  clearData: () => Promise<void>;
  isLoaded: boolean; // indicates storage has been loaded
};

const STORAGE_KEY = 'emg_csv_rows_v1';

const EmgDataContext = createContext<EmgContextValue | null>(null);

export function EmgDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<EMGRow[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as EMGRow[];
          setData(parsed);
        }
      } catch {
        // if storage is corrupt, ignore and start fresh
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  const setDataAndPersist = async (rows: EMGRow[]) => {
    setData(rows);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  };

  const clearData = async () => {
    setData([]);
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(
    () => ({ data, setDataAndPersist, clearData, isLoaded }),
    [data, isLoaded]
  );

  return <EmgDataContext.Provider value={value}>{children}</EmgDataContext.Provider>;
}

export function useEmgData() {
  const ctx = useContext(EmgDataContext);
  if (!ctx) throw new Error('useEmgData must be used inside EmgDataProvider');
  return ctx;
}
