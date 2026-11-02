import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';

import { hasReachedBackend } from '@/api/client';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { ConnectingBanner } from '@/components/ConnectingBanner';
import { Icon } from '@/components/Icon';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useAuth } from '@/features/auth';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme';

export default function RootIndex() {
  const { state, user, retry } = useAuth();
  const { colors } = useTheme();
  const [retrying, setRetrying] = useState(false);
  const [isConnectingSlow, setIsConnectingSlow] = useState(false);

  const isPendingConnection = state === 'loading' || retrying;

  useEffect(() => {
    if (!isPendingConnection) {
      return;
    }

    const timer = setTimeout(() => {
      if (!hasReachedBackend()) {
        setIsConnectingSlow(true);
      }
    }, 5000);

    return () => {
      clearTimeout(timer);
      setIsConnectingSlow(false);
    };
  }, [isPendingConnection]);

  if (state === 'unauthenticated') {
    return <Redirect href="/(auth)/login" />;
  }

  if (state === 'authenticated') {
    if (user?.role === 'OPERARIO') {
      return <Redirect href="/(dueno)/panel" />;
    }
    return <Redirect href="/(cliente)/buscar" />;
  }

  // state is either 'loading' (session being restored) or 'offline'
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
          {state === 'loading' && !isConnectingSlow ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <Icon
              name={isConnectingSlow ? 'Clock' : 'WifiOff'}
              size={48}
              color={isConnectingSlow ? colors.info : colors.textMuted}
            />
          )}
        </View>

        {isConnectingSlow ? (
          <View style={styles.bannerWrapper}>
            <ConnectingBanner />
          </View>
        ) : state === 'loading' ? null : (
          <>
            <AppText variant="title" style={styles.offlineTitle}>
              Sin conexión con el servidor
            </AppText>

            <AppText variant="body" color="textMuted" style={styles.offlineSubtitle}>
              Verifica tu conexión a la red local o internet e inténtalo de nuevo.
            </AppText>
          </>
        )}

        <Button
          title={isPendingConnection ? 'Conectando…' : 'Reintentar'}
          variant="primary"
          size="lg"
          loading={isPendingConnection}
          disabled={isPendingConnection}
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
  bannerWrapper: {
    width: '100%',
    marginBottom: spacing[24],
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
