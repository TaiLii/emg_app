/**
 * Core Type Definitions for EMG App
 */

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
}

export interface EMGSession {
  id: string;
  userId: string;
  name: string;
  description?: string;
  muscleGroups: string[];
  samplingRate: number; // Hz
  channelCount: number;
  duration: number; // ms
  startedAt: string;
  endedAt?: string;
  deviceInfo?: {
    deviceId: string;
    deviceName: string;
    firmwareVersion?: string;
  };
  metadata?: Record<string, any>;
}

export interface EMGSample {
  id: string;
  sessionId: string;
  userId: string;
  timestamp: string;
  sampleNumber: number;
  channels: number[]; // Raw ADC values for each channel
  processed?: {
    filtered?: number[];
    rectified?: number[];
    rms?: number;
  };
}

export interface EMGBatch {
  id: string;
  sessionId: string;
  userId: string;
  samples: EMGSample[];
  startTime: string;
  endTime: string;
  batchNumber: number;
}

export interface SessionStatistics {
  sessionId: string;
  userId: string;
  totalSamples: number;
  duration: number;
  averageRMS: number[];
  peakValues: number[];
  minValues: number[];
  maxValues: number[];
  signalQuality: number; // 0-100
}

export interface AuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  issuedAt: number;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface DBError {
  code: string;
  message: string;
  originalError?: Error;
  timestamp: string;
}
