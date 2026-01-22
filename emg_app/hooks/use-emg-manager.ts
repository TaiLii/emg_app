/**
 * EMG Data Manager Hook
 * Handles EMG session and sample management
 */

import { useCallback, useState } from 'react';
import * as db from '@/utils/database-enhanced';
import { EMGSession, EMGSample, SessionStatistics } from '@/types';

interface EMGManagerState {
  currentSession: EMGSession | null;
  sessions: EMGSession[];
  samples: EMGSample[];
  statistics: SessionStatistics | null;
  isLoading: boolean;
  error: string | null;
}

export const useEMGManager = (userId: string | null) => {
  const [state, setState] = useState<EMGManagerState>({
    currentSession: null,
    sessions: [],
    samples: [],
    statistics: null,
    isLoading: false,
    error: null,
  });

  // Load user sessions
  const loadSessions = useCallback(async () => {
    if (!userId) return;

    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const sessions = await db.getUserSessions(userId);
      setState((prev) => ({ ...prev, sessions, isLoading: false }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load sessions';
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
    }
  }, [userId]);

  // Create new session
  const createSession = useCallback(
    async (sessionData: Omit<EMGSession, 'id' | 'userId' | 'startedAt'>) => {
      if (!userId) throw new Error('User not authenticated');

      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));
        const session = await db.createEMGSession(userId, sessionData);
        setState((prev) => ({
          ...prev,
          currentSession: session,
          sessions: [session, ...prev.sessions],
          isLoading: false,
        }));
        return session;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create session';
        setState((prev) => ({ ...prev, isLoading: false, error: message }));
        throw error;
      }
    },
    [userId]
  );

  // End current session
  const endSession = useCallback(async (sessionId: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const session = await db.endEMGSession(sessionId);
      setState((prev) => ({
        ...prev,
        currentSession: null,
        isLoading: false,
      }));
      return session;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to end session';
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
      throw error;
    }
  }, []);

  // Load session data
  const loadSessionData = useCallback(async (sessionId: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const session = await db.getSessionById(sessionId);
      const samples = await db.getSessionSamples(sessionId);

      setState((prev) => ({
        ...prev,
        currentSession: session,
        samples,
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load session data';
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
    }
  }, []);

  // Add sample to current session
  const addSample = useCallback(
    async (sampleData: Omit<EMGSample, 'id' | 'sessionId' | 'userId'>) => {
      if (!userId || !state.currentSession) {
        throw new Error('No active session');
      }

      try {
        const sample = await db.addEMGSample(state.currentSession.id, userId, sampleData);
        setState((prev) => ({
          ...prev,
          samples: [...prev.samples, sample],
        }));
        return sample;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to add sample';
        setState((prev) => ({ ...prev, error: message }));
        throw error;
      }
    },
    [userId, state.currentSession]
  );

  // Calculate statistics
  const calculateStatistics = useCallback(async (sessionId: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      const stats = await db.calculateSessionStatistics(sessionId);
      setState((prev) => ({
        ...prev,
        statistics: stats,
        isLoading: false,
      }));
      return stats;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to calculate statistics';
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
      throw error;
    }
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    loadSessions,
    createSession,
    endSession,
    loadSessionData,
    addSample,
    calculateStatistics,
    clearError,
  };
};
