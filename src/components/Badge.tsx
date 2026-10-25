import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { AppIconName, Icon } from './Icon';
import { getPhase } from '@/lib/phases';
import { radius, spacing, typography, WashPhaseCode } from '@/theme/tokens';
import { useTheme } from '@/theme';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'accent'
  | 'danger'
  | 'warning'
  | 'info'
  | 'phase';

export interface BadgeProps {
  label?: string;
  variant?: BadgeVariant;
  phase?: WashPhaseCode;
  icon?: AppIconName;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}

export function Badge({
  label,
  variant = 'default',
  phase,
  icon,
  size = 'md',
  style,
}: BadgeProps) {
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
    switch (variant) {
      case 'primary':
        backgroundColor = isDark ? 'rgba(34, 211, 238, 0.15)' : 'rgba(14, 116, 144, 0.1)';
        textColor = colors.primary;
        borderColor = isDark ? 'rgba(34, 211, 238, 0.3)' : 'rgba(14, 116, 144, 0.2)';
        break;
      case 'accent':
        backgroundColor = isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.1)';
        textColor = colors.accent;
        borderColor = isDark ? 'rgba(52, 211, 153, 0.3)' : 'rgba(16, 185, 129, 0.2)';
        break;
      case 'danger':
        backgroundColor = isDark ? 'rgba(248, 113, 113, 0.15)' : 'rgba(220, 38, 38, 0.1)';
        textColor = colors.danger;
        borderColor = isDark ? 'rgba(248, 113, 113, 0.3)' : 'rgba(220, 38, 38, 0.2)';
        break;
      case 'warning':
        backgroundColor = isDark ? 'rgba(251, 191, 36, 0.15)' : 'rgba(217, 119, 6, 0.1)';
        textColor = colors.warning;
        borderColor = isDark ? 'rgba(251, 191, 36, 0.3)' : 'rgba(217, 119, 6, 0.2)';
        break;
      case 'info':
        backgroundColor = isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.1)';
        textColor = colors.info;
        borderColor = isDark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(2, 132, 199, 0.2)';
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
