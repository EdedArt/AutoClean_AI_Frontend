import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
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

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    if (state === 'loading' || retrying) {
      timer = setTimeout(() => {
        if (!hasReachedBackend()) {
          setIsConnectingSlow(true);
        }
      }, 5000);
    } else {
      setIsConnectingSlow(false);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [state, retrying]);

  if (state === 'loading') {
    if (!isConnectingSlow) {
      return null;
    }

    return (
      <ScreenContainer contentContainerStyle={styles.offlineContainer}>
        <View style={styles.offlineContent}>
          <View style={[styles.iconWrapper, { backgroundColor: colors.surfaceAlt }]}>
            <Icon name="Clock" size={48} color={colors.info} />
          </View>

          <View style={styles.bannerWrapper}>
            <ConnectingBanner />
          </View>
        </View>
      </ScreenContainer>
    );
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
          <Icon
            name={isConnectingSlow ? 'Clock' : 'WifiOff'}
            size={48}
            color={isConnectingSlow ? colors.info : colors.textMuted}
          />
        </View>

        {isConnectingSlow ? (
          <View style={styles.bannerWrapper}>
            <ConnectingBanner />
          </View>
        ) : (
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
          title={isConnectingSlow ? 'Conectando…' : 'Reintentar'}
          variant="primary"
          size="lg"
          loading={retrying}
          disabled={retrying}
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
