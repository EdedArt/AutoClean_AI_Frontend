import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ProgressBar } from './ProgressBar';
import { type SearchedPlateEntry } from '@/api/plates';
import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { Icon } from '@/components/Icon';
import { getPhase } from '@/lib/phases';
import { formatPlateInput } from '@/lib/plate';
import { useTheme } from '@/theme';
import { radius, shadows, spacing } from '@/theme/tokens';

export interface HistoryItemProps {
  entry: SearchedPlateEntry;
  onSelect: (placa: string) => void;
  onDelete: (placa: string) => void;
}

export function HistoryItem({ entry, onSelect, onDelete }: HistoryItemProps) {
  const { colors, phaseColors, isDark } = useTheme();
  const formattedPlate = formatPlateInput(entry.placa);
  const status = entry.status;
  const isDimmed = status === null;

  let itemAccessibilityLabel = formattedPlate;
  if (status) {
    const phaseInfo = getPhase(status.fase);
    const phaseLabel = phaseInfo?.label ?? status.fase;
    const vehicleInfo = [status.marca, status.modelo, status.color].filter(Boolean).join(' ');
    itemAccessibilityLabel = `${formattedPlate}${vehicleInfo ? `, ${vehicleInfo}` : ''}, fase ${phaseLabel}, ${status.porcentajeProgreso}%${status.etaLabel ? `, ${status.etaLabel}` : ''}`;
  } else if (entry.message) {
    itemAccessibilityLabel = `${formattedPlate}, ${entry.message}`;
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
        accessibilityHint="Toca para consultar el estado completo de esta placa"
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
              {status.etaLabel ? (
                <View style={styles.etaContainer}>
                  <Icon name="Clock" size={13} color={colors.textMuted} style={styles.etaIcon} />
                  <AppText variant="caption" muted numberOfLines={1}>
                    {status.etaLabel}
                  </AppText>
                </View>
              ) : null}
            </View>
          </View>
        ) : entry.message ? (
          <AppText variant="caption" muted style={styles.nullMessageText}>
            {entry.message}
          </AppText>
        ) : null}
      </Pressable>

      <Pressable
        onPress={() => onDelete(formattedPlate)}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`Quitar ${formattedPlate} del historial`}
        accessibilityHint="Abre confirmación para eliminar esta placa del historial"
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
    letterSpacing: 0.6,
  },
  vehicleText: {
    marginTop: 2,
  },
  badge: {
    marginTop: 2,
  },
  activeDetailsBlock: {
    marginTop: spacing[8],
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
    marginTop: spacing[4],
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
