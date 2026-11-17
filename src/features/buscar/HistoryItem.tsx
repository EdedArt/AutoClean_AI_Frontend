import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ProgressBar } from './ProgressBar';
import { type SearchedPlateEntry } from '@/api/plates';
import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { Icon } from '@/components/Icon';
import { getEtaLabel } from '@/lib/i18nFormat';
import { formatPlateInput } from '@/lib/plate';
import { useTheme } from '@/theme';
import { radius, shadows, spacing } from '@/theme/tokens';

export interface HistoryItemProps {
  entry: SearchedPlateEntry;
  onSelect: (placa: string) => void;
  onDelete: (placa: string) => void;
}

export function HistoryItem({ entry, onSelect, onDelete }: HistoryItemProps) {
  const { t } = useTranslation();
  const { colors, phaseColors, isDark } = useTheme();
  const formattedPlate = formatPlateInput(entry.placa);
  const status = entry.status;
  const isDimmed = status === null;
  const etaText = status ? getEtaLabel(t, status) : null;
  // Backend message is Spanish-only; the only case it covers is "no active wash for this plate".
  const notFoundText = entry.message ? t('client.notFound') : null;

  let itemAccessibilityLabel = formattedPlate;
  if (status) {
    const phaseLabel = t(`phases.${status.fase}`);
    const vehicleInfo = [status.marca, status.modelo, status.color].filter(Boolean).join(' ');
    itemAccessibilityLabel = `${formattedPlate}${vehicleInfo ? `, ${vehicleInfo}` : ''}, ${phaseLabel}, ${status.porcentajeProgreso}%${etaText ? `, ${etaText}` : ''}`;
  } else if (notFoundText) {
    itemAccessibilityLabel = `${formattedPlate}, ${notFoundText}`;
  }

  const vehicleDetails = status
    ? [[status.marca, status.modelo].filter(Boolean).join(' '), status.color]
        .filter(Boolean)
        .join(' · ')
    : null;

  const currentPhaseColor = status ? phaseColors[status.fase].main : colors.primary;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDimmed ? colors.surfaceDimmed : colors.surface,
          borderColor: colors.border,
        },
        !isDark && !isDimmed ? shadows.sm : null,
      ]}
    >
      <Pressable
        onPress={() => onSelect(formattedPlate)}
        accessible
        accessibilityRole="button"
        accessibilityLabel={itemAccessibilityLabel}
        accessibilityHint={t('client.historyItemHint')}
        style={({ pressed }) => [
          styles.mainButton,
          isDimmed && styles.dimmedContent,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.topRow}>
          <View style={styles.plateBlock}>
            <AppText
              variant="subtitle"
              weight="bold"
              color={isDimmed ? 'textMuted' : 'text'}
              style={styles.plateText}
            >
              {formattedPlate}
            </AppText>
            {vehicleDetails ? (
              <AppText variant="caption" muted numberOfLines={1} style={styles.vehicleText}>
                {vehicleDetails}
              </AppText>
            ) : null}
          </View>

          {status ? (
            <Badge variant="phase" phase={status.fase} size="sm" style={styles.badge} />
          ) : null}
        </View>

        {status ? (
          <View style={styles.activeDetailsBlock}>
            <ProgressBar
              progress={status.porcentajeProgreso}
              color={currentPhaseColor}
              height={6}
              style={styles.progressBar}
            />
            <View style={styles.metaRow}>
              <AppText variant="caption" weight="semiBold" style={{ color: currentPhaseColor }}>
                {status.porcentajeProgreso}%
              </AppText>
              {etaText ? (
                <View style={styles.etaContainer}>
                  <Icon name="Clock" size={13} color={colors.textMuted} style={styles.etaIcon} />
                  <AppText variant="caption" muted numberOfLines={1}>
                    {etaText}
                  </AppText>
                </View>
              ) : null}
            </View>
          </View>
        ) : notFoundText ? (
          <AppText variant="caption" muted style={styles.nullMessageText}>
            {notFoundText}
          </AppText>
        ) : null}
      </Pressable>

      <Pressable
        onPress={() => onDelete(formattedPlate)}
        accessible
        accessibilityRole="button"
        accessibilityLabel={t('client.removeFromHistoryA11y', { plate: formattedPlate })}
        accessibilityHint={t('client.removeFromHistoryHint')}
        hitSlop={4}
        style={({ pressed }) => [
          styles.trashButton,
          { borderLeftColor: colors.border },
          pressed && styles.pressed,
        ]}
      >
        <Icon name="Trash2" size={18} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: radius[16],
    borderWidth: 1,
    marginBottom: spacing[12],
    overflow: 'hidden',
  },
  mainButton: {
    flex: 1,
    paddingVertical: spacing[12],
    paddingLeft: spacing[16],
    paddingRight: spacing[12],
    justifyContent: 'center',
  },
  dimmedContent: {
    opacity: 0.78,
  },
  pressed: {
    opacity: 0.7,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  plateBlock: {
    flex: 1,
    marginRight: spacing[8],
  },
  plateText: {
    fontSize: 19,
    letterSpacing: 0.6,
  },
  vehicleText: {
    marginTop: 2,
  },
  badge: {
    marginTop: 2,
  },
  activeDetailsBlock: {
    marginTop: spacing[12],
  },
  progressBar: {
    marginBottom: spacing[8],
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  etaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    marginLeft: spacing[8],
  },
  etaIcon: {
    marginRight: 4,
  },
  nullMessageText: {
    marginTop: spacing[8],
  },
  trashButton: {
    minWidth: 48,
    minHeight: 48,
    paddingHorizontal: spacing[12],
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
  },
});
