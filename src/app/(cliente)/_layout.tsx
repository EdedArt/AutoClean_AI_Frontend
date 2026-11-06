import { Redirect, Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Icon } from '@/components/Icon';
import { useAuth } from '@/features/auth';
import { useTheme } from '@/theme';

export default function ClienteLayout() {
  const { t } = useTranslation();
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
          title: t('common.search'),
          tabBarLabel: t('common.search'),
          tabBarIcon: ({ color, size }) => (
            <Icon name="Search" size={size} color={typeof color === 'string' ? color : undefined} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: t('common.profile'),
          tabBarLabel: t('common.profile'),
          tabBarIcon: ({ color, size }) => (
            <Icon name="User" size={size} color={typeof color === 'string' ? color : undefined} />
          ),
        }}
      />
    </Tabs>
  );
}
