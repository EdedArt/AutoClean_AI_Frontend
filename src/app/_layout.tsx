import { useEffect } from 'react';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { AuthProvider, useAuth } from '@/features/auth';
import { queryClient } from '@/lib/queryClient';
import { ThemeProvider, useTheme } from '@/theme';
import { QueryClientProvider } from '@tanstack/react-query';

SplashScreen.preventAutoHideAsync().catch(() => {});

function RootNavigator() {
  const { isThemeReady, colors } = useTheme();
  const { state: authState } = useAuth();
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const isReady = fontsLoaded && isThemeReady && authState !== 'loading';

  useEffect(() => {
    if (authState === 'unauthenticated') {
      queryClient.clear();
    }
  }, [authState]);

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
