import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/context/auth-context-enhanced';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isLoading, isSignedIn } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (!navigationState?.key) return;
    
    if (isLoading) {
      return;
    }

    // Check current route to avoid unnecessary redirects
    const currentSegment = segments[0];
    const inAuthGroup = currentSegment === 'login' || currentSegment === 'signup';

    // Don't redirect if we don't know where we are yet
    if (!currentSegment) {
      return;
    }

    console.log('Layout effect - isSignedIn:', isSignedIn, 'segment:', currentSegment);

    if (!isSignedIn && !inAuthGroup) {
      // Only redirect to login if not already on auth screens
      console.log('Layout redirect: not signed in -> /login');
      router.replace('/login');
    } else if (isSignedIn && inAuthGroup) {
      // Only redirect to tabs if signed in and still on auth screens
      console.log('Layout redirect: signed in -> /(tabs)');
      router.replace('/(tabs)');
    }
  }, [isLoading, isSignedIn, segments, navigationState?.key]);

  if (isLoading) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
