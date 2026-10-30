import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { type Bay } from '@/api/bays';
import { type WashPackage } from '@/api/packages';
import { DIRT_LEVELS, type DirtLevel } from '@/api/vehicles';
import { AppText } from '@/components/AppText';
import { Icon } from '@/components/Icon';
import { useTheme } from '@/theme';
import { radius, spacing, withAlpha } from '@/theme/tokens';

export interface PackageSelectorProps {
  packages: WashPackage[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  errorText?: string;
  disabled?: boolean;
}

export function PackageSelector({
  packages,
  selectedId,
  onSelect,
  errorText,
  disabled = false,
}: PackageSelectorProps) {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.section}>
      <AppText
        variant="body"
        weight="medium"
        style={[styles.label, errorText ? { color: colors.danger } : null]}
      >
        Paquete de lavado *
      </AppText>

      <View style={styles.packageList} accessibilityRole="radiogroup">
        {packages.map((pkg) => {
          const isSelected = selectedId === pkg.id;
          const borderColor = isSelected ? colors.primary : colors.border;
          const bgColor = isSelected
            ? withAlpha(colors.primary, isDark ? 0.18 : 0.08)
            : colors.surface;

          return (
            <Pressable
              key={pkg.id}
              disabled={disabled}
              onPress={() => onSelect(pkg.id)}
              accessible
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected, disabled }}
              accessibilityLabel={`Paquete ${pkg.nombre}: ${pkg.descripcion}${pkg.precio != null ? `, $${pkg.precio.toLocaleString('es-CO')}` : ''}`}
              style={({ pressed }) => [
                styles.packageOption,
                {
                  backgroundColor: bgColor,
                  borderColor,
                  borderWidth: isSelected ? 1.5 : 1,
                  opacity: disabled ? 0.6 : pressed ? 0.85 : 1,
                },
              ]}
            >
              <View style={styles.packageHeader}>
                <AppText variant="body" weight="semiBold" style={styles.packageName}>
                  {pkg.nombre}
                </AppText>
                {pkg.precio != null ? (
                  <AppText
                    variant="caption"
                    weight="bold"
                    style={{ color: isSelected ? colors.primary : colors.text }}
                  >
                    ${pkg.precio.toLocaleString('es-CO')}
                  </AppText>
                ) : null}
              </View>
              <AppText variant="caption" muted style={styles.packageDesc}>
                {pkg.descripcion}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {errorText ? (
        <AppText variant="caption" color="danger" style={styles.errorText}>
          {errorText}
        </AppText>
      ) : null}
    </View>
  );
}

export interface BaySelectorProps {
  bays: Bay[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  errorText?: string;
  disabled?: boolean;
}

export function BaySelector({
  bays,
  selectedId,
  onSelect,
  errorText,
  disabled = false,
}: BaySelectorProps) {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.section}>
      <AppText
        variant="body"
        weight="medium"
        style={[styles.label, errorText ? { color: colors.danger } : null]}
      >
        Bahía de lavado *
      </AppText>

      <View style={styles.bayGrid} accessibilityRole="radiogroup">
        {bays.map((bay) => {
          const isOccupied = bay.ocupada;
          const isSelected = selectedId === bay.id && !isOccupied;
          const isItemDisabled = disabled || isOccupied;

          let backgroundColor = colors.surface;
          let borderColor = colors.border;
          let textColor = colors.text;
          let statusColor = colors.accent;

          if (isOccupied) {
            backgroundColor = colors.disabledBackground;
            borderColor = colors.disabledBorder;
            textColor = colors.disabledText;
            statusColor = colors.danger;
          } else if (isSelected) {
            backgroundColor = withAlpha(colors.primary, isDark ? 0.18 : 0.1);
            borderColor = colors.primary;
            textColor = colors.primary;
            statusColor = colors.primary;
          }

          return (
            <Pressable
              key={bay.id}
              disabled={isItemDisabled}
              onPress={() => {
                if (!isOccupied) {
                  onSelect(bay.id);
                }
              }}
              accessible
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected, disabled: isItemDisabled }}
              accessibilityLabel={`Bahía ${bay.numero}, ${isOccupied ? 'Ocupada, no disponible' : 'Libre'}`}
              style={({ pressed }) => [
                styles.bayCard,
                {
                  backgroundColor,
                  borderColor,
                  borderWidth: isSelected ? 1.5 : 1,
                  opacity: isOccupied ? 0.65 : pressed && !disabled ? 0.85 : 1,
                },
              ]}
            >
              <View style={styles.bayTopRow}>
                <AppText variant="body" weight="bold" style={{ color: textColor }}>
                  Bahía {bay.numero}
                </AppText>
                {isSelected ? <Icon name="Check" size={16} color={colors.primary} /> : null}
              </View>
              <AppText variant="caption" weight="medium" style={{ color: statusColor }}>
                {isOccupied ? 'Ocupada' : 'Libre'}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {errorText ? (
        <AppText variant="caption" color="danger" style={styles.errorText}>
          {errorText}
        </AppText>
      ) : null}
    </View>
  );
}

export interface DirtLevelSelectorProps {
  selected: DirtLevel | undefined;
  onSelect: (level: DirtLevel | undefined) => void;
  disabled?: boolean;
}

export function DirtLevelSelector({
  selected,
  onSelect,
  disabled = false,
}: DirtLevelSelectorProps) {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.section}>
      <AppText variant="body" weight="medium" style={styles.label}>
        Nivel de suciedad (opcional)
      </AppText>

      <View style={styles.dirtRow} accessibilityRole="radiogroup">
        {DIRT_LEVELS.map((level) => {
          const isSelected = selected === level;
          const borderColor = isSelected ? colors.primary : colors.border;
          const backgroundColor = isSelected
            ? withAlpha(colors.primary, isDark ? 0.18 : 0.1)
            : colors.surface;

          return (
            <Pressable
              key={level}
              disabled={disabled}
              onPress={() => onSelect(isSelected ? undefined : level)}
              accessible
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected, disabled }}
              accessibilityLabel={`Nivel de suciedad ${level}`}
              style={({ pressed }) => [
                styles.dirtChip,
                {
                  backgroundColor,
                  borderColor,
                  borderWidth: isSelected ? 1.5 : 1,
                  opacity: disabled ? 0.6 : pressed ? 0.85 : 1,
                },
              ]}
            >
              <AppText
                variant="caption"
                weight={isSelected ? 'semiBold' : 'medium'}
                style={{ color: isSelected ? colors.primary : colors.text }}
              >
                {level}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    width: '100%',
    marginBottom: spacing[16],
  },
  label: {
    fontSize: 14,
    marginBottom: spacing[8],
  },
  packageList: {
    gap: spacing[8],
  },
  packageOption: {
    borderRadius: radius[12],
    padding: spacing[12],
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  packageName: {
    flex: 1,
    marginRight: spacing[8],
  },
  packageDesc: {
    lineHeight: 18,
  },
  bayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[8],
  },
  bayCard: {
    minWidth: '47%',
    flexGrow: 1,
    borderRadius: radius[12],
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[12],
  },
  bayTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dirtRow: {
    flexDirection: 'row',
    gap: spacing[8],
  },
  dirtChip: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius[12],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[8],
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
  },
});
