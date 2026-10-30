import React, { useCallback, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { ActiveOrderCard } from '@/features/dueno/ActiveOrderCard';
import { BaySummaryBar } from '@/features/dueno/BaySummaryBar';
import {
  filterActiveOrders,
  OrderFilterChips,
  type OrderFilterType,
} from '@/features/dueno/OrderFilterChips';
import { PanelSkeleton } from '@/features/dueno/PanelSkeleton';
import { useActiveOrders } from '@/features/dueno/useActiveOrders';
import { useBaySummary } from '@/features/dueno/useBaySummary';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';

export default function PanelScreen() {
  const { colors } = useTheme();
  const [selectedFilter, setSelectedFilter] = useState<OrderFilterType>('ALL');
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const {
    data,
    orders,
    isPending,
    isFetching,
    isError,
    isNetworkError,
    isRateLimited,
    refetch: refetchOrders,
  } = useActiveOrders();

  const {
    data: baySummary,
    isPending: isSummaryPending,
    refetch: refetchSummary,
  } = useBaySummary();

  const handleRefresh = useCallback(async () => {
    setIsManualRefreshing(true);
    try {
      await Promise.all([refetchOrders(), refetchSummary()]);
    } finally {
      setIsManualRefreshing(false);
    }
  }, [refetchOrders, refetchSummary]);

  const handleOpenOrder = (orderId: number) => {
    router.push(`/(dueno)/orden/${orderId}`);
  };

  const hasData = Boolean(data);
  const filteredOrders = filterActiveOrders(orders, selectedFilter);

  return (
    <ScreenContainer
      scroll
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isManualRefreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
          progressBackgroundColor={colors.surface}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <AppText variant="title" weight="bold" style={styles.title}>
          Panel de lavado
        </AppText>
        <AppText variant="caption" muted>
          Órdenes activas y ocupación de bahías en tiempo real
        </AppText>
      </View>

      {/* Offline Banner when cached data is retained */}
      {isNetworkError && hasData ? (
        <View
          style={[
            styles.offlineBanner,
            {
              backgroundColor: colors.surfaceAlt,
              borderColor: colors.warning,
            },
          ]}
          accessible
          accessibilityRole="alert"
        >
          <Icon name="WifiOff" size={16} color={colors.warning} style={styles.bannerIcon} />
          <AppText variant="caption" style={[styles.bannerText, { color: colors.warning }]}>
            Sin conexión. Mostrando el último estado.
          </AppText>
        </View>
      ) : null}

      {/* Real Bay Counters */}
      <BaySummaryBar summary={baySummary} isLoading={isSummaryPending && !baySummary} />

      {/* Filter Chips */}
      {hasData ? (
        <OrderFilterChips selected={selectedFilter} onSelect={setSelectedFilter} orders={orders} />
      ) : null}

      {/* 1. Loading State */}
      {isPending && !hasData ? <PanelSkeleton rows={3} /> : null}

      {/* 2. Error State (without cached data) */}
      {isError && !hasData ? (
        <Card variant="outlined" style={styles.stateCard} accessibilityRole="alert">
          <Icon
            name={isNetworkError ? 'WifiOff' : isRateLimited ? 'Clock' : 'AlertCircle'}
            size={36}
            color={isRateLimited ? colors.warning : colors.danger}
            style={styles.stateIcon}
          />
          <AppText variant="subtitle" weight="semiBold" style={styles.stateTitle}>
            {isNetworkError
              ? 'Sin conexión con el servidor'
              : isRateLimited
                ? 'Límite de consultas alcanzado'
                : 'No se pudieron cargar las órdenes'}
          </AppText>
          <AppText variant="caption" muted style={styles.stateDescription}>
            {isNetworkError
              ? 'Verifica que el backend esté activo e inténtalo de nuevo.'
              : isRateLimited
                ? 'Espera unos segundos antes de actualizar nuevamente.'
                : 'Ocurrió un inconveniente al obtener la lista de órdenes activas.'}
          </AppText>
          <Button
            title="Reintentar"
            leftIcon="RefreshCw"
            onPress={() => {
              void handleRefresh();
            }}
            loading={isFetching}
            style={styles.retryButton}
            accessibilityLabel="Reintentar carga del panel"
          />
        </Card>
      ) : null}

      {/* 3. Data State */}
      {hasData ? (
        orders.length === 0 ? (
          <Card variant="outlined" style={styles.stateCard}>
            <View style={[styles.emptyIconCircle, { backgroundColor: colors.surfaceAlt }]}>
              <Icon name="Car" size={28} color={colors.textMuted} />
            </View>
            <AppText variant="subtitle" weight="semiBold" style={styles.emptyTitle}>
              No hay carros en lavado.
            </AppText>
            <AppText variant="caption" muted style={styles.stateDescription}>
              Registra un vehículo en la pestaña Registrar para iniciar una orden.
            </AppText>
          </Card>
        ) : filteredOrders.length === 0 ? (
          <Card variant="outlined" style={styles.stateCard}>
            <View style={[styles.emptyIconCircle, { backgroundColor: colors.surfaceAlt }]}>
              <Icon name="Search" size={24} color={colors.textMuted} />
            </View>
            <AppText variant="body" muted style={styles.emptyFilterText}>
              No hay carros en lavado para el filtro seleccionado.
            </AppText>
          </Card>
        ) : (
          <View accessibilityRole="list">
            {filteredOrders.map((order) => (
              <ActiveOrderCard key={order.id} order={order} onPress={handleOpenOrder} />
            ))}
          </View>
        )
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing[16],
    paddingBottom: spacing[32],
  },
  header: {
    marginTop: spacing[8],
    marginBottom: spacing[16],
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    marginBottom: 4,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[8],
    paddingHorizontal: spacing[12],
    borderRadius: radius[8],
    borderWidth: 1,
    marginBottom: spacing[12],
  },
  bannerIcon: {
    marginRight: 6,
  },
  bannerText: {
    fontWeight: '500',
  },
  stateCard: {
    alignItems: 'center',
    paddingVertical: spacing[32],
    paddingHorizontal: spacing[16],
    marginTop: spacing[4],
  },
  stateIcon: {
    marginBottom: spacing[12],
  },
  stateTitle: {
    textAlign: 'center',
    marginBottom: spacing[8],
  },
  stateDescription: {
    textAlign: 'center',
    marginBottom: spacing[16],
    paddingHorizontal: spacing[8],
  },
  retryButton: {
    minWidth: 160,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[12],
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  emptyFilterText: {
    textAlign: 'center',
  },
});
