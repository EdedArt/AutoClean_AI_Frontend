import { Redirect, Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Icon } from '@/components/Icon';
import { useAuth } from '@/features/auth';
import { useTheme } from '@/theme';

export default function DuenoLayout() {
  const { t } = useTranslation();
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
          title: t('common.panel'),
          tabBarLabel: t('common.panel'),
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
          title: t('common.register'),
          tabBarLabel: t('common.register'),
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
