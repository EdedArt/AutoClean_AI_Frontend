import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { AppIconName, Icon } from './Icon';
import { getPhase } from '@/lib/phases';
import { radius, spacing, typography, WashPhaseCode, withAlpha } from '@/theme/tokens';
import { useTheme } from '@/theme';

export type BadgeVariant =
  'default' | 'primary' | 'accent' | 'danger' | 'warning' | 'info' | 'phase';

export interface BadgeProps {
  label?: string;
  variant?: BadgeVariant;
  phase?: WashPhaseCode;
  icon?: AppIconName;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}

export function Badge({ label, variant = 'default', phase, icon, size = 'md', style }: BadgeProps) {
  const { colors, phaseColors, isDark } = useTheme();

  let backgroundColor = colors.surfaceAlt;
  let textColor = colors.text;
  let borderColor = colors.border;
  let iconName = icon;
  let displayLabel = label ?? '';

  if (variant === 'phase' && phase) {
    const phaseInfo = getPhase(phase);
    const pColor = phaseColors[phase];

    if (pColor) {
      backgroundColor = pColor.bg;
      textColor = pColor.text;
      borderColor = pColor.border;
    }
    if (phaseInfo) {
      displayLabel = label ?? phaseInfo.label;
      iconName = icon ?? phaseInfo.icon;
    }
  } else {
    const bgAlpha = isDark ? 0.15 : 0.1;
    const borderAlpha = isDark ? 0.3 : 0.2;

    switch (variant) {
      case 'primary':
        backgroundColor = withAlpha(colors.primary, bgAlpha);
        textColor = colors.primary;
        borderColor = withAlpha(colors.primary, borderAlpha);
        break;
      case 'accent':
        backgroundColor = withAlpha(colors.accent, bgAlpha);
        textColor = colors.accent;
        borderColor = withAlpha(colors.accent, borderAlpha);
        break;
      case 'danger':
        backgroundColor = withAlpha(colors.danger, bgAlpha);
        textColor = colors.danger;
        borderColor = withAlpha(colors.danger, borderAlpha);
        break;
      case 'warning':
        backgroundColor = withAlpha(colors.warning, bgAlpha);
        textColor = colors.warning;
        borderColor = withAlpha(colors.warning, borderAlpha);
        break;
      case 'info':
        backgroundColor = withAlpha(colors.info, bgAlpha);
        textColor = colors.info;
        borderColor = withAlpha(colors.info, borderAlpha);
        break;
      default:
        break;
    }
  }

  const isSmall = size === 'sm';
  const iconSize = isSmall ? 12 : 14;
  const fontSize = isSmall ? 11 : 12;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor,
          borderColor,
          paddingVertical: isSmall ? spacing[4] : 6,
          paddingHorizontal: isSmall ? spacing[8] : spacing[12],
          borderRadius: radius.pill,
        },
        style,
      ]}
      accessibilityRole="text"
    >
      {iconName && (
        <Icon
          name={iconName}
          size={iconSize}
          color={textColor}
          strokeWidth={2.2}
          style={styles.icon}
        />
      )}
      <Text
        style={[
          styles.label,
          {
            color: textColor,
            fontSize,
            fontFamily: typography.fonts.semiBold,
          },
        ]}
      >
        {displayLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  icon: {
    marginRight: 5,
  },
  label: {
    fontWeight: '600',
  },
});
