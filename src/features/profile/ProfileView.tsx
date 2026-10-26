import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ThemeToggle } from '@/components/ThemeToggle';
import { getRoleLabel, useAuth } from '@/features/auth';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme';

export function ProfileView() {
  const { colors } = useTheme();
  const { user, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ],
      { cancelable: true },
    );
  };

  const roleLabel = getRoleLabel(user?.role);
  const isDueno = user?.role === 'OPERARIO';

  return (
    <ScreenContainer scroll contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View
          style={[
            styles.avatar,
            { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
          ]}
        >
          <Icon name="User" size={40} color={colors.primary} />
        </View>
        <AppText variant="title" style={styles.nameText}>
          {user?.nombre || 'Usuario'}
        </AppText>
        <AppText variant="caption" color="textMuted" style={styles.emailText}>
          {user?.email || ''}
        </AppText>
        <View style={styles.badgeRow}>
          <Badge
            label={roleLabel}
            variant={isDueno ? 'accent' : 'primary'}
            icon={isDueno ? 'LayoutDashboard' : 'User'}
            size="md"
          />
        </View>
      </View>

      <Card variant="elevated" style={styles.sectionCard}>
        <AppText variant="subtitle" style={styles.sectionTitle}>
          Apariencia
        </AppText>
        <View style={styles.themeRow}>
          <AppText variant="body" color="textMuted">
            Tema de la aplicación
          </AppText>
          <ThemeToggle showLabel={false} />
        </View>
      </Card>

      {__DEV__ && (
        <Card variant="outlined" style={styles.sectionCard}>
          <AppText variant="subtitle" style={styles.sectionTitle}>
            Entorno de desarrollo
          </AppText>
          <Button
            title="Ver Guía de Estilos"
            variant="secondary"
            size="md"
            leftIcon="Sparkles"
            onPress={() => router.push('/style-guide')}
          />
        </Card>
      )}

      <View style={styles.actionsContainer}>
        <Button
          title="Cerrar sesión"
          variant="secondary"
          size="lg"
          leftIcon="LogOut"
          onPress={handleSignOut}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[24],
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing[24],
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: spacing[12],
  },
  nameText: {
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  emailText: {
    textAlign: 'center',
    marginBottom: spacing[8],
  },
  badgeRow: {
    marginTop: spacing[4],
  },
  sectionCard: {
    marginBottom: spacing[16],
  },
  sectionTitle: {
    marginBottom: spacing[12],
  },
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[4],
  },
  actionsContainer: {
    marginTop: spacing[16],
  },
});
