import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useAuth } from '@/features/auth';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme';

export default function RootIndex() {
  const { state, user, retry } = useAuth();
  const { colors } = useTheme();
  const [retrying, setRetrying] = useState(false);

  if (state === 'loading') {
    return null;
  }

  if (state === 'unauthenticated') {
    return <Redirect href="/(auth)/login" />;
  }

  if (state === 'authenticated') {
    if (user?.role === 'OPERARIO') {
      return <Redirect href="/(dueno)/panel" />;
    }
    return <Redirect href="/(cliente)/buscar" />;
  }

  // state === 'offline'
  const handleRetry = async () => {
    setRetrying(true);
    try {
      await retry();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <ScreenContainer contentContainerStyle={styles.offlineContainer}>
      <View style={styles.offlineContent}>
        <View style={[styles.iconWrapper, { backgroundColor: colors.surfaceAlt }]}>
          <Icon name="WifiOff" size={48} color={colors.textMuted} />
        </View>

        <AppText variant="title" style={styles.offlineTitle}>
          Sin conexión con el servidor
        </AppText>

        <AppText variant="body" color="textMuted" style={styles.offlineSubtitle}>
          Verifica tu conexión a la red local o internet e inténtalo de nuevo.
        </AppText>

        <Button
          title="Reintentar"
          variant="primary"
          size="lg"
          loading={retrying}
          onPress={handleRetry}
          style={styles.retryButton}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  offlineContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[24],
  },
  offlineContent: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
  },
  iconWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[20],
  },
  offlineTitle: {
    textAlign: 'center',
    marginBottom: spacing[8],
  },
  offlineSubtitle: {
    textAlign: 'center',
    marginBottom: spacing[24],
    lineHeight: 22,
  },
  retryButton: {
    width: '100%',
  },
});
