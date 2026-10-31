import React from 'react';
import { StyleSheet, View } from 'react-native';

import { CarIllustration } from './CarIllustration';
import { PhaseTracker } from './PhaseTracker';
import { ProgressBar } from './ProgressBar';
import { type PlateStatus } from '@/api/plates';
import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { getPhase } from '@/lib/phases';
import { useTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';

export interface StatusCardProps {
  status: PlateStatus;
}

export function StatusCard({ status }: StatusCardProps) {
  const { colors, phaseColors } = useTheme();
  const currentPhaseInfo = getPhase(status.fase);
  const phaseLabel = currentPhaseInfo?.label ?? status.fase;
  const currentPhaseColor = phaseColors[status.fase].main;

  const vehicleDetails = `${status.marca} ${status.modelo} · ${status.color}`;

  const accessibilitySummary = `Estado del vehículo con placa ${status.placa}: ${vehicleDetails}. Fase actual: ${phaseLabel}, progreso: ${status.porcentajeProgreso} por ciento. Tiempo estimado: ${status.etaLabel}.`;

  return (
    <Card
      variant="elevated"
      style={styles.card}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={accessibilitySummary}
    >
      {/* Header: Plate + Phase Badge */}
      <View style={styles.headerRow}>
        <View style={styles.plateContainer}>
          <AppText variant="display" weight="bold" style={styles.plateText}>
            {status.placa}
          </AppText>
          <AppText variant="body" muted style={styles.vehicleSubtitle}>
            {vehicleDetails}
          </AppText>
        </View>

        <Badge variant="phase" phase={status.fase} />
      </View>

      {/* Center Illustration */}
      <View style={styles.illustrationSection}>
        <CarIllustration phase={status.fase} />
      </View>

      {/* Unified Status Block: Progress + ETA + Stepper */}
      <View
        style={[
          styles.statusBlock,
          { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
        ]}
      >
        <View style={styles.progressHeaderRow}>
          <View style={styles.percentBlock}>
            <AppText variant="subtitle" weight="bold" style={{ color: currentPhaseColor }}>
              {status.porcentajeProgreso}%
            </AppText>
          </View>

          {status.etaLabel ? (
            <View
              style={[
                styles.etaBlock,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Icon name="Clock" size={14} color={colors.textMuted} style={styles.etaIcon} />
              <AppText variant="caption" muted style={styles.etaText}>
                {status.etaLabel}
              </AppText>
            </View>
          ) : null}
        </View>

        <View style={styles.progressBarWrapper}>
          <ProgressBar progress={status.porcentajeProgreso} color={currentPhaseColor} height={8} />
        </View>

        <View style={styles.trackerWrapper}>
          <PhaseTracker currentPhase={status.fase} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    padding: spacing[16],
    marginBottom: spacing[16],
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[8],
  },
  plateContainer: {
    flex: 1,
    marginRight: spacing[12],
  },
  plateText: {
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: 0.8,
  },
  vehicleSubtitle: {
    marginTop: 2,
    fontSize: 14,
  },
  illustrationSection: {
    marginVertical: spacing[8],
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBlock: {
    padding: spacing[12],
    borderRadius: radius[12],
    borderWidth: 1,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  percentBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  etaBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '65%',
    paddingHorizontal: spacing[8],
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  etaIcon: {
    marginRight: 4,
  },
  etaText: {
    fontWeight: '500',
  },
  progressBarWrapper: {
    marginBottom: spacing[16],
  },
  trackerWrapper: {
    width: '100%',
    paddingTop: spacing[4],
  },
});
