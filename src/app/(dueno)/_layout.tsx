import { Redirect, Tabs } from 'expo-router';

import { Icon } from '@/components/Icon';
import { useAuth } from '@/features/auth';
import { useTheme } from '@/theme';

export default function DuenoLayout() {
  const { colors } = useTheme();
  const { state, user } = useAuth();

  if (state === 'unauthenticated') {
    return <Redirect href="/(auth)/login" />;
  }

  if (state === 'offline') {
    return <Redirect href="/" />;
  }

  if (state === 'authenticated' && user?.role !== 'OPERARIO') {
    return <Redirect href="/(cliente)/buscar" />;
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
        name="panel"
        options={{
          title: 'Panel',
          tabBarLabel: 'Panel',
          tabBarIcon: ({ color, size }) => (
            <Icon
              name="LayoutDashboard"
              size={size}
              color={typeof color === 'string' ? color : undefined}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="registrar"
        options={{
          title: 'Registrar',
          tabBarLabel: 'Registrar',
          tabBarIcon: ({ color, size }) => (
            <Icon
              name="ClipboardList"
              size={size}
              color={typeof color === 'string' ? color : undefined}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Icon name="User" size={size} color={typeof color === 'string' ? color : undefined} />
          ),
        }}
      />
    </Tabs>
  );
}
