import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { ApiError } from '@/api/client';
import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { ScreenContainer } from '@/components/ScreenContainer';
import { PhaseTracker } from '@/features/buscar/PhaseTracker';
import { ProgressBar } from '@/features/buscar/ProgressBar';
import { AiAnalyzerCard } from '@/features/dueno/AiAnalyzerCard';
import { ManualPhaseControl } from '@/features/dueno/ManualPhaseControl';
import { useActiveOrders } from '@/features/dueno/useActiveOrders';
import { useAiStatus } from '@/features/dueno/useCatalogs';
import {
  useDeliverOrder,
  useMarkOrderReady,
  useUpdateOrderPhase,
} from '@/features/dueno/useOrderMutations';
import { getPhase } from '@/lib/phases';
import { formatPlateInput } from '@/lib/plate';
import { useTheme } from '@/theme';
import { radius, spacing, WashPhaseCode } from '@/theme/tokens';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const orderId = Number(id);
  const { colors, phaseColors } = useTheme();

  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [pendingManualPhase, setPendingManualPhase] = useState<WashPhaseCode | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deliveredPlaca, setDeliveredPlaca] = useState<string | null>(null);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');

  const {
    data,
    orders,
    isPending,
    isError,
    isNetworkError,
    refetch: refetchOrders,
  } = useActiveOrders({
    pausePolling: isAiAnalyzing,
  });

  const { data: aiStatus, isError: isAiStatusError, refetch: refetchAiStatus } = useAiStatus();

  const { mutate: markReady, isPending: isMarkingReady } = useMarkOrderReady();
  const { mutate: changePhaseManual } = useUpdateOrderPhase();
  const { mutate: deliverOrderMutation, isPending: isDelivering } = useDeliverOrder();

  const order = orders.find((item) => item.id === orderId);

  const handleRefresh = useCallback(async () => {
    setIsManualRefreshing(true);
    try {
      await Promise.all([refetchOrders(), refetchAiStatus()]);
    } finally {
      setIsManualRefreshing(false);
    }
  }, [refetchOrders, refetchAiStatus]);

  const handleBackToPanel = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(dueno)/panel');
    }
  };

  const handleMarkReady = () => {
    if (!order) {
      return;
    }
    setActionError(null);
    markReady(order.id, {
      onSuccess: () => {
        setLiveAnnouncement('Vehículo marcado como listo para lavar');
      },
      onError: (err) => {
        if (err instanceof ApiError) {
          setActionError(err.message);
        } else {
          setActionError('No se pudo marcar la orden como lista para lavar.');
        }
      },
    });
  };

  const handleManualPhaseChange = (targetPhase: WashPhaseCode) => {
    if (!order) {
      return;
    }
    setActionError(null);
    setPendingManualPhase(targetPhase);
    changePhaseManual(
      { orderId: order.id, faseActual: targetPhase },
      {
        onSuccess: (updated) => {
          setPendingManualPhase(null);
          const phaseLabel = getPhase(updated.faseActual)?.label ?? updated.faseActual;
          setLiveAnnouncement(`Fase actualizada manualmente a ${phaseLabel}`);
        },
        onError: (err) => {
          setPendingManualPhase(null);
          if (err instanceof ApiError) {
            setActionError(err.message);
          } else {
            setActionError('No se pudo actualizar la fase manualmente.');
          }
        },
      },
    );
  };

  const handleConfirmDeliver = () => {
    if (!order || order.faseActual !== 'LISTO') {
      return;
    }

    const placaFormatted = order.vehicle?.placa
      ? formatPlateInput(order.vehicle.placa)
      : `#${order.id}`;

    Alert.alert(
      'Entregar vehículo',
      `¿Confirmas la entrega del vehículo con placa ${placaFormatted} al cliente?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Entregar',
          style: 'default',
          onPress: () => {
            setActionError(null);
            deliverOrderMutation(order.id, {
              onSuccess: () => {
                setDeliveredPlaca(placaFormatted);
                setLiveAnnouncement(
                  `Vehículo ${placaFormatted} entregado. Salió de la lista de lavado activo.`,
                );
              },
              onError: (err) => {
                if (err instanceof ApiError) {
                  setActionError(err.message);
                } else {
                  setActionError('No se pudo registrar la entrega del vehículo.');
                }
              },
            });
          },
        },
      ],
    );
  };

  // Delivered Success Screen State
  if (deliveredPlaca) {
    return (
      <ScreenContainer contentContainerStyle={styles.centeredContainer}>
        <Card variant="elevated" style={styles.stateCard} accessibilityRole="alert">
          <View style={[styles.successCircle, { backgroundColor: colors.surfaceAlt }]}>
            <Icon name="CircleCheck" size={36} color={colors.accent} />
          </View>
          <AppText variant="title" weight="bold" style={styles.stateTitle}>
            Vehículo entregado
          </AppText>
          <AppText variant="body" muted style={styles.stateDescription}>
            El vehículo con placa {deliveredPlaca} fue entregado al cliente y salió de la lista de
            órdenes activas.
          </AppText>
          <Button
            title="Volver al panel"
            leftIcon="LayoutDashboard"
            onPress={() => router.replace('/(dueno)/panel')}
            style={styles.stateButton}
          />
        </Card>
      </ScreenContainer>
    );
  }

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
      {/* Accessibility Live Region */}
      <View
        accessible
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
        style={styles.srOnly}
      >
        <AppText>{liveAnnouncement}</AppText>
      </View>

      {/* Top Back Bar */}
      <View style={styles.navBar}>
        <Pressable
          onPress={handleBackToPanel}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Volver al panel de órdenes"
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Icon name="ArrowLeft" size={20} color={colors.text} style={styles.backIcon} />
          <AppText variant="body" weight="medium">
            Panel
          </AppText>
        </Pressable>
      </View>

      {/* Offline Banner */}
      {isNetworkError && Boolean(data) ? (
        <View
          style={[
            styles.offlineBanner,
            { backgroundColor: colors.surfaceAlt, borderColor: colors.warning },
          ]}
          accessible
          accessibilityRole="alert"
        >
          <Icon name="WifiOff" size={16} color={colors.warning} style={styles.bannerIcon} />
          <AppText variant="caption" style={{ color: colors.warning }}>
            Sin conexión. Mostrando el último estado.
          </AppText>
        </View>
      ) : null}

      {/* Loading State */}
      {isPending && !data ? (
        <Card variant="outlined" style={styles.stateCard}>
          <ActivityIndicator size="large" color={colors.primary} style={styles.stateIcon} />
          <AppText variant="body" muted>
            Cargando detalle de la orden...
          </AppText>
        </Card>
      ) : null}

      {/* Error State without data */}
      {isError && !data ? (
        <Card variant="outlined" style={styles.stateCard}>
          <Icon name="WifiOff" size={32} color={colors.danger} style={styles.stateIcon} />
          <AppText variant="subtitle" weight="semiBold" style={styles.stateTitle}>
            No se pudo cargar la orden
          </AppText>
          <AppText variant="caption" muted style={styles.stateDescription}>
            Verifica tu conexión con el servidor e inténtalo nuevamente.
          </AppText>
          <Button
            title="Reintentar"
            leftIcon="RefreshCw"
            onPress={() => {
              void handleRefresh();
            }}
            style={styles.stateButton}
          />
        </Card>
      ) : null}

      {/* Order Not Found in Active List */}
      {data && !order ? (
        <Card variant="outlined" style={styles.stateCard}>
          <Icon name="Car" size={32} color={colors.textMuted} style={styles.stateIcon} />
          <AppText variant="subtitle" weight="semiBold" style={styles.stateTitle}>
            Orden no disponible en lavado activo
          </AppText>
          <AppText variant="caption" muted style={styles.stateDescription}>
            Esta orden ya fue entregada o no se encuentra en la lista de lavado activo.
          </AppText>
          <Button
            title="Volver al panel"
            variant="secondary"
            onPress={() => router.replace('/(dueno)/panel')}
            style={styles.stateButton}
          />
        </Card>
      ) : null}

      {/* Active Order Content */}
      {order ? (
        <View>
          {/* Header Summary Card */}
          <Card variant="elevated" style={styles.headerCard}>
            <View style={styles.headerTopRow}>
              <View style={styles.plateBlock}>
                <AppText variant="title" weight="bold" style={styles.plateText}>
                  {order.vehicle?.placa
                    ? formatPlateInput(order.vehicle.placa)
                    : `Orden #${order.id}`}
                </AppText>
                {order.vehicle ? (
                  <AppText variant="body" muted style={styles.vehicleSubtitle}>
                    {[
                      [order.vehicle.marca, order.vehicle.modelo].filter(Boolean).join(' '),
                      order.vehicle.color,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </AppText>
                ) : null}
              </View>

              <Badge variant="phase" phase={order.faseActual} />
            </View>

            {/* Bay and Package Metadata (only when returned by backend) */}
            {order.bay || order.package || order.vehicle?.nivelSuciedad ? (
              <View style={[styles.metaStrip, { borderTopColor: colors.border }]}>
                {order.bay ? (
                  <View style={styles.metaPill}>
                    <AppText variant="caption" muted>
                      Bahía:
                    </AppText>
                    <AppText variant="caption" weight="semiBold" style={styles.metaValue}>
                      #{order.bay.numero}
                    </AppText>
                  </View>
                ) : null}

                {order.package ? (
                  <View style={styles.metaPill}>
                    <AppText variant="caption" muted>
                      Paquete:
                    </AppText>
                    <AppText variant="caption" weight="semiBold" style={styles.metaValue}>
                      {order.package.nombre}
                    </AppText>
                  </View>
                ) : null}

                {order.vehicle?.nivelSuciedad ? (
                  <View style={styles.metaPill}>
                    <AppText variant="caption" muted>
                      Suciedad:
                    </AppText>
                    <AppText variant="caption" weight="semiBold" style={styles.metaValue}>
                      {order.vehicle.nivelSuciedad}
                    </AppText>
                  </View>
                ) : null}
              </View>
            ) : null}

            {/* Progress & Verbatim ETA */}
            <View style={styles.progressHeaderRow}>
              <AppText
                variant="subtitle"
                weight="bold"
                style={{ color: phaseColors[order.faseActual].main }}
              >
                {order.porcentajeProgreso}%
              </AppText>

              {order.etaLabel ? (
                <View style={styles.etaRow}>
                  <Icon name="Clock" size={14} color={colors.textMuted} style={styles.etaIcon} />
                  <AppText variant="caption" muted>
                    {order.etaLabel}
                  </AppText>
                </View>
              ) : null}
            </View>

            <ProgressBar
              progress={order.porcentajeProgreso}
              color={phaseColors[order.faseActual].main}
              height={8}
              style={styles.progressBar}
            />

            <PhaseTracker currentPhase={order.faseActual} />

            {/* "Marcar listo para lavar" when listoParaLavar is false */}
            {!order.listoParaLavar ? (
              <View style={[styles.readySection, { borderTopColor: colors.border }]}>
                <AppText variant="caption" muted style={styles.readyHint}>
                  El vehículo está en espera. Márcalo como listo para iniciar el lavado y habilitar
                  el análisis con IA.
                </AppText>
                <Button
                  title="Marcar listo para lavar"
                  leftIcon="Check"
                  onPress={handleMarkReady}
                  loading={isMarkingReady}
                  disabled={isMarkingReady || isAiAnalyzing}
                />
              </View>
            ) : null}
          </Card>

          {/* Action Error Banner */}
          {actionError ? (
            <View
              style={[
                styles.errorBanner,
                { backgroundColor: colors.surfaceAlt, borderColor: colors.danger },
              ]}
              accessible
              accessibilityRole="alert"
            >
              <Icon name="AlertCircle" size={18} color={colors.danger} style={styles.bannerIcon} />
              <AppText variant="caption" color="danger" style={styles.errorBannerText}>
                {actionError}
              </AppText>
            </View>
          ) : null}

          {/* PRIMARY ACTION: Analizar con IA */}
          <AiAnalyzerCard
            order={order}
            aiStatus={aiStatus}
            isAiStatusError={isAiStatusError}
            onAnalysisStateChange={setIsAiAnalyzing}
            onAnnounce={setLiveAnnouncement}
          />

          {/* SECONDARY FALLBACK: Control manual (collapsed by default) */}
          <ManualPhaseControl
            currentPhase={order.faseActual}
            disabled={isAiAnalyzing || isDelivering || isMarkingReady}
            loadingPhase={pendingManualPhase}
            onSelectPhase={handleManualPhaseChange}
          />

          {/* DELIVER ACTION: Enabled ONLY when phase is LISTO */}
          <Card variant="outlined" style={styles.deliverCard}>
            <View style={styles.deliverHeader}>
              <AppText variant="subtitle" weight="semiBold">
                Entrega del vehículo
              </AppText>
              <AppText variant="caption" muted style={styles.deliverSubtitle}>
                {order.faseActual === 'LISTO'
                  ? 'El lavado ha finalizado (100%). Ya puedes entregar el vehículo al cliente.'
                  : 'La entrega se habilitará únicamente cuando el vehículo alcance la fase Listo.'}
              </AppText>
            </View>
            <Button
              title="Entregar"
              size="lg"
              leftIcon="CircleCheck"
              disabled={order.faseActual !== 'LISTO' || isDelivering || isAiAnalyzing}
              loading={isDelivering}
              onPress={handleConfirmDeliver}
              accessibilityLabel="Entregar vehículo terminado al cliente"
            />
          </Card>
        </View>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing[16],
    paddingBottom: spacing[32],
  },
  centeredContainer: {
    justifyContent: 'center',
    padding: spacing[16],
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[12],
  },
  backButton: {
    minHeight: 44,
    minWidth: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing[12],
  },
  backIcon: {
    marginRight: 6,
  },
  pressed: {
    opacity: 0.7,
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
  stateCard: {
    alignItems: 'center',
    paddingVertical: spacing[32],
    paddingHorizontal: spacing[16],
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
  },
  stateButton: {
    minWidth: 160,
  },
  successCircle: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[16],
  },
  headerCard: {
    padding: spacing[16],
    marginBottom: spacing[16],
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[12],
  },
  plateBlock: {
    flex: 1,
    marginRight: spacing[8],
  },
  plateText: {
    fontSize: 26,
    letterSpacing: 1,
  },
  vehicleSubtitle: {
    marginTop: 2,
    fontSize: 14,
  },
  metaStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[12],
    borderTopWidth: 1,
    paddingTop: spacing[12],
    marginBottom: spacing[12],
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaValue: {
    marginLeft: 4,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  etaIcon: {
    marginRight: 4,
  },
  progressBar: {
    marginBottom: spacing[16],
  },
  readySection: {
    borderTopWidth: 1,
    marginTop: spacing[16],
    paddingTop: spacing[12],
  },
  readyHint: {
    marginBottom: spacing[12],
    lineHeight: 18,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[12],
    borderRadius: radius[12],
    borderWidth: 1,
    marginBottom: spacing[16],
  },
  errorBannerText: {
    flex: 1,
  },
  deliverCard: {
    padding: spacing[16],
    marginBottom: spacing[16],
  },
  deliverHeader: {
    marginBottom: spacing[12],
  },
  deliverSubtitle: {
    marginTop: 4,
    lineHeight: 18,
  },
  srOnly: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    overflow: 'hidden',
  },
});
