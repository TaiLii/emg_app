/**
 * MIGRATION GUIDE: Database Upgrade
 * 
 * This file explains how to integrate the new enhanced database
 * and authentication system into your existing app.
 */

# EMG App Database & Auth Enhancements

## Summary of Improvements

### 1. Authentication
- ✅ Password validation (min 8 chars, uppercase, lowercase, number, special char)
- ✅ Email validation
- ✅ Username validation (3-30 chars, alphanumeric, -, _)
- ✅ Token management (access + refresh tokens)
- ✅ Secure session persistence
- ✅ Better error handling

### 2. Database Layer
- ✅ Enhanced EMG schema with sessions
- ✅ Better query methods with filtering and sorting
- ✅ Sample and batch management
- ✅ Statistics calculation (RMS, peak values, etc.)
- ✅ Proper error handling with error codes
- ✅ Cross-platform (Web + Mobile)

### 3. EMG Data Structure
```typescript
EMGSession {
  id: string
  userId: string
  name: string
  muscleGroups: string[]
  samplingRate: number (Hz)
  channelCount: number
  duration: number (ms)
  deviceInfo?: { deviceId, deviceName, firmwareVersion }
  metadata?: any
  startedAt: ISO string
  endedAt?: ISO string
}

EMGSample {
  id: string
  sessionId: string
  timestamp: ISO string
  sampleNumber: number
  channels: number[] (one per channel)
  processed?: { filtered, rectified, rms }
}

SessionStatistics {
  totalSamples: number
  duration: number
  averageRMS: number[] (per channel)
  peakValues: number[]
  minValues: number[]
  maxValues: number[]
  signalQuality: 0-100
}
```

## Integration Steps

### Step 1: Update Auth Context
Replace your current `auth-context.tsx` with `auth-context-enhanced.tsx`:

```typescript
// In your app's root layout or App.tsx
import { AuthProvider } from '@/context/auth-context-enhanced';

export default function App() {
  return (
    <AuthProvider>
      {/* Your app */}
    </AuthProvider>
  );
}
```

### Step 2: Update Login/Signup Screens
```typescript
const LoginScreen = () => {
  const { signIn, error, clearError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await signIn(username, password);
      // Navigate to main app
    } catch (error) {
      console.error(error);
    }
  };

  return (
    // Your UI
  );
};
```

### Step 3: Use EMG Manager Hook
```typescript
const EMGScreen = () => {
  const { user } = useAuth();
  const emgManager = useEMGManager(user?.id || null);

  // Create a session
  const startRecording = async () => {
    await emgManager.createSession({
      name: 'Bicep Recording',
      muscleGroups: ['bicep'],
      samplingRate: 1000,
      channelCount: 2,
      duration: 60000,
      deviceInfo: {
        deviceId: 'esp32_001',
        deviceName: 'EMG Device',
      },
    });
  };

  // Add samples as they arrive
  const handleSampleReceived = async (channels: number[]) => {
    await emgManager.addSample({
      timestamp: new Date().toISOString(),
      sampleNumber: emgManager.samples.length,
      channels,
    });
  };

  // End session and calculate stats
  const stopRecording = async () => {
    if (emgManager.currentSession) {
      await emgManager.endSession(emgManager.currentSession.id);
      await emgManager.calculateStatistics(emgManager.currentSession.id);
    }
  };

  return (
    // Your UI
  );
};
```

## Key Differences from Old System

### Old Database
- Simple EMGData with just values, muscleGroup, timestamp
- Basic user authentication
- No session management
- Simple hash (not secure for production)

### New Database
- Structured EMGSession + EMGSample
- Multiple channels per sample
- Device information tracking
- Statistics pre-calculation
- Better error handling
- Token-based authentication
- Proper validation

## Features Ready for Future

1. **Backend Integration**: Easy to sync with backend API
2. **Offline-First**: Works without network, syncs when connected
3. **Batch Operations**: Efficient bulk sample insertion
4. **Real-time Streaming**: WebSocket handler ready
5. **Statistics Caching**: Pre-calculated metrics
6. **Multi-device Support**: Track multiple EMG devices

## Files Created

```
/utils/
  - auth-utils.ts          (Validation & token utils)
  - database-enhanced.ts   (New DB layer)

/hooks/
  - use-emg-manager.ts     (EMG data management hook)

/context/
  - auth-context-enhanced.tsx  (Enhanced auth context)

/types/
  - index.ts               (Type definitions)
```

## Next Steps

1. Keep old database.ts for backward compatibility
2. Gradually migrate screens to use new auth context
3. Test thoroughly on both Web and Mobile
4. Consider adding backend API layer
5. Add real BLE data streaming integration

## Important Notes

⚠️ **Password Hashing**: The current implementation uses a simple hash.
For production, integrate with a backend that uses bcrypt/argon2.

⚠️ **Storage Limits**: localStorage has ~5-10MB limit. For large EMG datasets,
consider backend storage or compression.

⚠️ **Security**: Don't store sensitive data in localStorage on web.
Use secure HTTP-only cookies for web auth.

✅ **Mobile**: Uses SecureStore for tokens (Secure Enclave on iOS, Keystore on Android)
