import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CarIllustration } from './CarIllustration';
import { PhaseTracker } from './PhaseTracker';
import { ProgressBar } from './ProgressBar';
import { type PlateStatus } from '@/api/plates';
import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import {
  getBodyTypeName,
  getEtaLabel,
  getPackageName,
  getVehicleColorName,
  getVehicleSummary,
} from '@/lib/i18nFormat';
import { FALLBACK_COLOR_HEX, isHexColor, mapVehicleColor } from '@/lib/vehicleColor';
import { getPhase } from '@/lib/phases';
import { useTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';

export interface StatusCardProps {
  status: PlateStatus;
}

export function StatusCard({ status }: StatusCardProps) {
  const { t } = useTranslation();
  const { colors, phaseColors } = useTheme();
  const currentPhaseInfo = getPhase(status.fase);
  const phaseLabel = t(`phases.${status.fase}`);
  const phaseDescription = t(`statusMessages.${status.fase}`);
  const etaText = getEtaLabel(t, status);
  const statusPackage = status.package ?? status.paquete ?? null;
  const packageName = statusPackage ? getPackageName(t, statusPackage) : null;
  const currentPhaseColor = phaseColors[status.fase].main;
  const incluyePolichado = Boolean(
    status.incluyePolichado ??
    status.paquete?.incluyePolichado ??
    status.package?.incluyePolichado ??
    (status.fase === 'POLICHADO' || [25, 45, 65, 85].includes(status.porcentajeProgreso)),
  );

  const vehicleDetails = getVehicleSummary(t, status);
  const colorName = getVehicleColorName(t, status.color);
  const bodyTypeName = getBodyTypeName(t, status.bodyType);
  const illustrationLabel = t(
    bodyTypeName ? 'vehicle.illustrationA11y' : 'vehicle.illustrationA11yGeneric',
    {
      bodyType: bodyTypeName,
      brand: status.marca.trim(),
      model: status.modelo.trim(),
      color: colorName,
      phase: phaseLabel,
    },
  );

  // Paint: backend colorHex when it recognized the color, else the same local mapper
  // (older backends), else neutral gray for a known silhouette, else the original theme car.
  const localColor = mapVehicleColor(status.color);
  const backendHex = isHexColor(status.colorHex) ? status.colorHex : null;
  const backendKnown = backendHex !== null && backendHex.toUpperCase() !== FALLBACK_COLOR_HEX;
  const paintHex = backendKnown
    ? backendHex
    : localColor.isKnown
      ? localColor.hex
      : status.bodyType
        ? FALLBACK_COLOR_HEX
        : null;

  const accessibilitySummary = `${status.placa}: ${vehicleDetails}${bodyTypeName ? ` (${bodyTypeName})` : ''}. ${phaseLabel}, ${status.porcentajeProgreso}%.${packageName ? ` ${t('orderDetail.package')}: ${packageName}.` : ''} ${etaText ?? ''}`;

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
          {packageName ? (
            <AppText variant="caption" muted style={styles.vehicleSubtitle}>
              {t('orderDetail.package')}: {packageName}
            </AppText>
          ) : null}
        </View>

        <Badge variant="phase" phase={status.fase} />
      </View>

      {phaseDescription ? (
        <View style={styles.descriptionRow}>
          <Icon
            name={currentPhaseInfo?.icon ?? 'Sparkles'}
            size={14}
            color={currentPhaseColor}
            style={styles.descriptionIcon}
          />
          <AppText variant="caption" style={{ color: currentPhaseColor }}>
            {phaseDescription}
          </AppText>
        </View>
      ) : null}

      {/* Center Illustration */}
      <View style={styles.illustrationSection}>
        <CarIllustration
          phase={status.fase}
          bodyType={status.bodyType ?? null}
          paintHex={paintHex}
          accessibilityLabel={illustrationLabel}
        />
        <AppText
          variant="body"
          weight="semiBold"
          style={styles.vehicleCaption}
          numberOfLines={2}
          accessibilityElementsHidden
          importantForAccessibility="no"
        >
          {vehicleDetails}
        </AppText>
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

          {etaText ? (
            <View
              style={[
                styles.etaBlock,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Icon name="Clock" size={14} color={colors.textMuted} style={styles.etaIcon} />
              <AppText variant="caption" muted style={styles.etaText}>
                {etaText}
              </AppText>
            </View>
          ) : null}
        </View>

        <View style={styles.progressBarWrapper}>
          <ProgressBar progress={status.porcentajeProgreso} color={currentPhaseColor} height={8} />
        </View>

        <View style={styles.trackerWrapper}>
          <PhaseTracker
            currentPhase={status.fase}
            incluyePolichado={incluyePolichado}
            orden={status}
          />
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
  descriptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  descriptionIcon: {
    marginRight: 6,
  },
  illustrationSection: {
    marginVertical: spacing[8],
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleCaption: {
    marginTop: spacing[4],
    fontSize: 15,
    textAlign: 'center',
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
