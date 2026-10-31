import React from 'react';
import { StyleSheet, View } from 'react-native';

import { type ServiceOrder } from '@/api/orders';
import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { ProgressBar } from '@/features/buscar/ProgressBar';
import { getPhase } from '@/lib/phases';
import { formatPlateInput } from '@/lib/plate';
import { useTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';

export interface ActiveOrderCardProps {
  order: ServiceOrder;
  onPress: (orderId: number) => void;
}

export function ActiveOrderCard({ order, onPress }: ActiveOrderCardProps) {
  const { colors, phaseColors } = useTheme();

  const placa = order.vehicle?.placa ? formatPlateInput(order.vehicle.placa) : `#${order.id}`;
  const vehicleSubtitle = order.vehicle
    ? [[order.vehicle.marca, order.vehicle.modelo].filter(Boolean).join(' '), order.vehicle.color]
        .filter(Boolean)
        .join(' · ')
    : '';

  const phaseInfo = getPhase(order.faseActual);
  const phaseLabel = phaseInfo?.label ?? order.faseActual;
  const phaseColor = phaseColors[order.faseActual].main;

  const accessibilityLabel = `Orden de placa ${placa}${vehicleSubtitle ? `, ${vehicleSubtitle}` : ''}, fase ${phaseLabel}, progreso ${order.porcentajeProgreso}%${order.etaLabel ? `, ${order.etaLabel}` : ''}`;

  return (
    <Card
      variant="elevated"
      onPress={() => onPress(order.id)}
      style={styles.card}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Toca para abrir el detalle de la orden y analizar con IA"
    >
      <View style={styles.topRow}>
        <View style={styles.plateColumn}>
          <AppText variant="subtitle" weight="bold" style={styles.plateText}>
            {placa}
          </AppText>
          {vehicleSubtitle ? (
            <AppText variant="caption" muted numberOfLines={1} style={styles.vehicleSubtitle}>
              {vehicleSubtitle}
            </AppText>
          ) : null}
        </View>

        <Badge variant="phase" phase={order.faseActual} size="sm" />
      </View>

      <ProgressBar
        progress={order.porcentajeProgreso}
        color={phaseColor}
        height={6}
        style={styles.progressBar}
      />

      <View style={styles.bottomRow}>
        <View style={styles.metaLeft}>
          <AppText variant="caption" weight="semiBold" style={{ color: phaseColor }}>
            {order.porcentajeProgreso}%
          </AppText>
          {order.bay ? (
            <View
              style={[
                styles.bayTag,
                { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
              ]}
            >
              <AppText variant="caption" muted>
                Bahía {order.bay.numero}
              </AppText>
            </View>
          ) : null}
        </View>

        <View style={styles.metaRight}>
          {order.etaLabel ? (
            <View style={styles.etaRow}>
              <Icon name="Clock" size={13} color={colors.textMuted} style={styles.etaIcon} />
              <AppText variant="caption" muted numberOfLines={1}>
                {order.etaLabel}
              </AppText>
            </View>
          ) : null}
          <Icon name="ChevronRight" size={16} color={colors.textMuted} style={styles.chevron} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing[12],
    padding: spacing[16],
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[12],
  },
  plateColumn: {
    flex: 1,
    marginRight: spacing[8],
  },
  plateText: {
    fontSize: 19,
    letterSpacing: 0.6,
  },
  vehicleSubtitle: {
    marginTop: 2,
  },
  progressBar: {
    marginBottom: spacing[8],
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
  },
  bayTag: {
    paddingHorizontal: spacing[8],
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  metaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    marginLeft: spacing[8],
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  etaIcon: {
    marginRight: 4,
  },
  chevron: {
    marginLeft: 6,
  },
});
