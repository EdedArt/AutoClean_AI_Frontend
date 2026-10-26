import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/features/auth';
import { useTheme } from '@/theme';

export default function AuthLayout() {
  const { colors } = useTheme();
  const { state, user } = useAuth();

  if (state === 'authenticated') {
    if (user?.role === 'OPERARIO') {
      return <Redirect href="/(dueno)/panel" />;
    }
    return <Redirect href="/(cliente)/buscar" />;
  }

  if (state === 'offline') {
    return <Redirect href="/" />;
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
