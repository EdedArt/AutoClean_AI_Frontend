import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { useTheme } from '@/theme';
import { radius, spacing, withAlpha } from '@/theme/tokens';

export function HistoryEmptyState() {
  const { colors } = useTheme();

  return (
    <Card
      variant="outlined"
      style={styles.stateCard}
      accessible
      accessibilityRole="text"
      accessibilityLabel="Aún no has buscado ninguna placa."
    >
      <View style={[styles.iconCircle, { backgroundColor: colors.surfaceAlt }]}>
        <Icon name="Clock" size={24} color={colors.textMuted} />
      </View>
      <AppText variant="body" muted style={styles.emptyMessage}>
        Aún no has buscado ninguna placa.
      </AppText>
    </Card>
  );
}

export interface HistoryErrorStateProps {
  isRateLimited?: boolean;
  isNetworkError?: boolean;
  isFetching?: boolean;
  onRetry: () => void;
}

export function HistoryErrorState({
  isRateLimited = false,
  isNetworkError = false,
  isFetching = false,
  onRetry,
}: HistoryErrorStateProps) {
  const { colors, isDark } = useTheme();

  if (isRateLimited) {
    return (
      <Card variant="outlined" style={styles.stateCard} accessibilityRole="alert">
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: withAlpha(colors.warning, isDark ? 0.18 : 0.1) },
          ]}
        >
          <Icon name="Clock" size={24} color={colors.warning} />
        </View>
        <AppText variant="subtitle" weight="semiBold" style={styles.stateTitle}>
          Demasiadas consultas seguidas
        </AppText>
        <AppText variant="caption" muted style={styles.stateDescription}>
          Espera unos momentos antes de volver a actualizar tu historial de placas.
        </AppText>
        <Button
          title="Reintentar"
          variant="secondary"
          leftIcon="RefreshCw"
          onPress={onRetry}
          loading={isFetching}
          style={styles.retryButton}
          accessibilityLabel="Reintentar carga del historial"
        />
      </Card>
    );
  }

  return (
    <Card variant="outlined" style={styles.stateCard} accessibilityRole="alert">
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: withAlpha(colors.danger, isDark ? 0.18 : 0.1) },
        ]}
      >
        <Icon name={isNetworkError ? 'WifiOff' : 'RefreshCw'} size={24} color={colors.danger} />
      </View>
      <AppText variant="subtitle" weight="semiBold" style={styles.stateTitle}>
        {isNetworkError ? 'Sin conexión con el servidor' : 'No se pudo cargar el historial'}
      </AppText>
      <AppText variant="caption" muted style={styles.stateDescription}>
        {isNetworkError
          ? 'Verifica tu conexión e inténtalo nuevamente.'
          : 'Ocurrió un inconveniente al consultar tus búsquedas recientes.'}
      </AppText>
      <Button
        title="Reintentar"
        leftIcon="RefreshCw"
        onPress={onRetry}
        loading={isFetching}
        style={styles.retryButton}
        accessibilityLabel="Reintentar carga del historial"
      />
    </Card>
  );
}

export function HistoryOfflineBanner() {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: withAlpha(colors.warning, isDark ? 0.14 : 0.08),
          borderColor: withAlpha(colors.warning, isDark ? 0.4 : 0.3),
        },
      ]}
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Icon name="WifiOff" size={16} color={colors.warning} style={styles.bannerIcon} />
      <AppText variant="caption" style={[styles.bannerText, { color: colors.warning }]}>
        Sin conexión. Mostrando el historial guardado.
      </AppText>
    </View>
  );
}

export function HistoryRateLimitBanner() {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: withAlpha(colors.warning, isDark ? 0.14 : 0.08),
          borderColor: withAlpha(colors.warning, isDark ? 0.4 : 0.3),
        },
      ]}
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Icon name="Clock" size={16} color={colors.warning} style={styles.bannerIcon} />
      <AppText variant="caption" style={[styles.bannerText, { color: colors.warning }]}>
        Límite de consultas alcanzado. Mostrando el historial guardado.
      </AppText>
    </View>
  );
}

export interface HistoryRollbackBannerProps {
  message: string;
  onDismiss: () => void;
}

export function HistoryRollbackBanner({ message, onDismiss }: HistoryRollbackBannerProps) {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.rollbackBanner,
        {
          backgroundColor: withAlpha(colors.danger, isDark ? 0.16 : 0.08),
          borderColor: withAlpha(colors.danger, isDark ? 0.4 : 0.3),
        },
      ]}
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <AppText variant="caption" style={[styles.rollbackText, { color: colors.danger }]}>
        {message}
      </AppText>
      <Pressable
        onPress={onDismiss}
        accessible
        accessibilityRole="button"
        accessibilityLabel="Cerrar aviso de error"
        style={styles.dismissButton}
      >
        <Icon name="X" size={16} color={colors.danger} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  stateCard: {
    alignItems: 'center',
    paddingVertical: spacing[24],
    paddingHorizontal: spacing[16],
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[12],
  },
  emptyMessage: {
    textAlign: 'center',
  },
  stateTitle: {
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  stateDescription: {
    textAlign: 'center',
    marginBottom: spacing[16],
    paddingHorizontal: spacing[8],
  },
  retryButton: {
    minWidth: 160,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[8],
    paddingHorizontal: spacing[12],
    borderRadius: radius[12],
    borderWidth: 1,
    marginBottom: spacing[12],
  },
  bannerIcon: {
    marginRight: 6,
  },
  bannerText: {
    fontWeight: '500',
    flexShrink: 1,
  },
  rollbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: spacing[12],
    paddingRight: spacing[4],
    paddingVertical: spacing[4],
    borderRadius: radius[12],
    borderWidth: 1,
    marginBottom: spacing[12],
  },
  rollbackText: {
    flex: 1,
    fontWeight: '500',
    marginRight: spacing[8],
  },
  dismissButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
