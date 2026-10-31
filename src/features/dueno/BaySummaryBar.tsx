import React from 'react';
import { StyleSheet, View } from 'react-native';

import { type BaySummary } from '@/api/bays';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { useTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';

export interface BaySummaryBarProps {
  summary: BaySummary | undefined;
  isLoading?: boolean;
}

export function BaySummaryBar({ summary, isLoading = false }: BaySummaryBarProps) {
  const { colors } = useTheme();

  if (isLoading && !summary) {
    return (
      <View
        style={[
          styles.skeletonContainer,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
        accessible
        accessibilityLabel="Cargando estado de bahías"
      >
        <View style={[styles.skeletonBlock, { backgroundColor: colors.surfaceAlt }]} />
        <View style={[styles.skeletonBlock, { backgroundColor: colors.surfaceAlt }]} />
        <View style={[styles.skeletonBlock, { backgroundColor: colors.surfaceAlt }]} />
      </View>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <Card
      variant="elevated"
      style={styles.card}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`Resumen de bahías: ${summary.total} en total, ${summary.occupied} ocupadas, ${summary.free} libres`}
    >
      <View style={styles.item}>
        <AppText variant="title" weight="bold" style={{ color: colors.text }}>
          {summary.total}
        </AppText>
        <AppText variant="caption" muted style={styles.label}>
          Bahías totales
        </AppText>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.item}>
        <AppText variant="title" weight="bold" style={{ color: colors.primary }}>
          {summary.occupied}
        </AppText>
        <AppText variant="caption" muted style={styles.label}>
          Ocupadas
        </AppText>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.item}>
        <AppText variant="title" weight="bold" style={{ color: colors.accent }}>
          {summary.free}
        </AppText>
        <AppText variant="caption" muted style={styles.label}>
          Libres
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[16],
    paddingHorizontal: spacing[16],
    marginBottom: spacing[16],
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 36,
  },
  skeletonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderRadius: radius[16],
    borderWidth: 1,
    paddingVertical: spacing[16],
    paddingHorizontal: spacing[16],
    marginBottom: spacing[16],
  },
  skeletonBlock: {
    width: 72,
    height: 36,
    borderRadius: radius[8],
  },
});
