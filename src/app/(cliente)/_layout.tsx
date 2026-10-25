import { Redirect, Tabs } from 'expo-router';

import { Icon } from '@/components/Icon';
import { useAuth } from '@/features/auth';
import { useTheme } from '@/theme';

export default function ClienteLayout() {
  const { colors } = useTheme();
  const { state, user } = useAuth();

  if (state === 'unauthenticated') {
    return <Redirect href="/(auth)/login" />;
  }

  if (state === 'offline') {
    return <Redirect href="/" />;
  }

  if (state === 'authenticated' && user?.role !== 'CLIENTE') {
    return <Redirect href="/(dueno)/panel" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="buscar"
        options={{
          title: 'Buscar',
          tabBarLabel: 'Buscar',
          tabBarIcon: ({ color, size }) => <Icon name="Search" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color, size }) => <Icon name="User" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
