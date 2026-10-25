import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { ApiError } from '@/api/client';
import { getHealth } from '@/api/health';
import { AppText, Button, Card, Icon, Logo, ScreenContainer, ThemeToggle } from '@/components';
import { spacing, withAlpha } from '@/theme/tokens';
import { useTheme } from '@/theme';

type ConnectionStatus = 'loading' | 'success' | 'error';

export default function HomeScreen() {
  const { colors } = useTheme();
  const [status, setStatus] = useState<ConnectionStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resolveErrorMessage = (error: unknown): string => {
    if (error instanceof ApiError) {
      return error.message;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'Ocurrió un error inesperado al conectar con el servidor';
  };

  const handleRetry = useCallback(async () => {
    setStatus('loading');
    setErrorMessage(null);
    try {
      await getHealth();
      setStatus('success');
    } catch (error: unknown) {
      setStatus('error');
      setErrorMessage(resolveErrorMessage(error));
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    getHealth()
      .then(() => {
        if (isMounted) {
          setStatus('success');
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setStatus('error');
          setErrorMessage(resolveErrorMessage(error));
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <ScreenContainer contentContainerStyle={styles.container}>
      <View style={styles.topBar}>
        <ThemeToggle showLabel={false} />
      </View>

      <View style={styles.centerContent}>
        <Logo size={56} variant="full" style={styles.logo} />

        <Card style={styles.statusCard}>
          <AppText variant="subtitle" style={styles.cardHeader}>
            Estado de Conexión
          </AppText>

          {status === 'loading' && (
            <View style={styles.stateWrapper}>
              <ActivityIndicator size="large" color={colors.primary} />
              <AppText variant="body" muted style={styles.statusMessage}>
                Verificando conexión con el servidor...
              </AppText>
            </View>
          )}

          {status === 'success' && (
            <View style={styles.stateWrapper}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: withAlpha(colors.accent, 0.15) },
                ]}
              >
                <Icon name="CircleCheck" size={28} color={colors.accent} />
              </View>
              <AppText variant="subtitle" style={[styles.statusTitle, { color: colors.accent }]}>
                Servidor conectado
              </AppText>
              <AppText variant="caption" muted style={styles.statusDescription}>
                La API respondió exitosamente al chequeo de salud.
              </AppText>
            </View>
          )}

          {status === 'error' && (
            <View style={styles.stateWrapper}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: withAlpha(colors.danger, 0.15) },
                ]}
              >
                <Icon name="WifiOff" size={28} color={colors.danger} />
              </View>
              <AppText variant="subtitle" style={[styles.statusTitle, { color: colors.danger }]}>
                Sin conexión con el servidor
              </AppText>
              {errorMessage ? (
                <AppText variant="caption" style={[styles.errorDetail, { color: colors.danger }]}>
                  {errorMessage}
                </AppText>
              ) : null}
              <Button
                title="Reintentar"
                variant="primary"
                leftIcon="RefreshCw"
                onPress={handleRetry}
                style={styles.retryButton}
              />
            </View>
          )}
        </Card>

        {/* Link visible a la guía de estilos */}
        <View style={styles.navSection}>
          <Button
            title="Ver Guía de Estilos (F1)"
            variant="secondary"
            rightIcon="ChevronRight"
            onPress={() => router.push('/style-guide')}
            style={styles.styleGuideButton}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    padding: spacing[16],
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingBottom: spacing[24],
  },
  logo: {
    marginBottom: spacing[24],
  },
  statusCard: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    paddingVertical: spacing[24],
    paddingHorizontal: spacing[20],
  },
  cardHeader: {
    marginBottom: spacing[16],
    textAlign: 'center',
  },
  stateWrapper: {
    alignItems: 'center',
    width: '100%',
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[12],
  },
  statusTitle: {
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  statusMessage: {
    marginTop: spacing[12],
    textAlign: 'center',
  },
  statusDescription: {
    textAlign: 'center',
    marginTop: 4,
  },
  errorDetail: {
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 8,
  },
  retryButton: {
    marginTop: spacing[16],
    minWidth: 150,
  },
  navSection: {
    marginTop: spacing[24],
    width: '100%',
    maxWidth: 400,
  },
  styleGuideButton: {
    width: '100%',
  },
});
