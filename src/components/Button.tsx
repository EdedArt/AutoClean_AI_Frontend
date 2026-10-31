import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import { AppIconName, Icon } from './Icon';
import { radius, spacing, typography, withAlpha } from '@/theme/tokens';
import { useTheme } from '@/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: AppIconName;
  rightIcon?: AppIconName;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  style,
  accessibilityLabel,
  ...rest
}: ButtonProps) {
  const { colors, isDark } = useTheme();
  const isInactive = disabled || loading;

  const getBackgroundColor = (pressed: boolean) => {
    if (isInactive) {
      return variant === 'ghost' ? 'transparent' : colors.disabledBackground;
    }
    if (variant === 'primary') {
      return pressed ? withAlpha(colors.primary, 0.85) : colors.primary;
    }
    if (variant === 'secondary') {
      return pressed ? colors.surfaceAlt : colors.surface;
    }
    if (variant === 'destructive') {
      return pressed
        ? withAlpha(colors.danger, isDark ? 0.24 : 0.16)
        : withAlpha(colors.danger, isDark ? 0.14 : 0.08);
    }
    return pressed ? withAlpha(colors.primary, 0.1) : 'transparent';
  };

  const getTextColor = () => {
    if (isInactive) {
      return colors.disabledText;
    }
    if (variant === 'primary') {
      return colors.onPrimary;
    }
    if (variant === 'secondary') {
      return colors.text;
    }
    if (variant === 'destructive') {
      return colors.danger;
    }
    return colors.primary;
  };

  const getBorderColor = () => {
    if (isInactive) {
      return variant === 'ghost' ? 'transparent' : colors.disabledBorder;
    }
    if (variant === 'secondary') {
      return colors.border;
    }
    if (variant === 'destructive') {
      return withAlpha(colors.danger, isDark ? 0.45 : 0.3);
    }
    return 'transparent';
  };

  const minHeight = size === 'sm' ? 44 : size === 'lg' ? 54 : 48;
  const horizontalPadding = size === 'sm' ? spacing[12] : size === 'lg' ? spacing[24] : spacing[16];
  const fontSize = size === 'sm' ? 14 : size === 'lg' ? 16 : 15;
  const iconSize = size === 'sm' ? 16 : 20;

  const textColor = getTextColor();
  const borderColor = getBorderColor();

  return (
    <Pressable
      disabled={isInactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: isInactive, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        {
          minHeight,
          paddingHorizontal: horizontalPadding,
          backgroundColor: getBackgroundColor(pressed),
          borderColor,
          borderWidth: variant === 'secondary' || variant === 'destructive' || isInactive ? 1 : 0,
          borderRadius: radius[12],
          width: fullWidth ? '100%' : undefined,
        },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} style={styles.loader} />
      ) : (
        leftIcon && (
          <View style={styles.leftIcon}>
            <Icon name={leftIcon} size={iconSize} color={textColor} />
          </View>
        )
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
        numberOfLines={1}
      >
        {title}
      </Text>

      {!loading && rightIcon && (
        <View style={styles.rightIcon}>
          <Icon name={rightIcon} size={iconSize} color={textColor} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '600',
    textAlign: 'center',
  },
  loader: {
    marginRight: spacing[8],
  },
  leftIcon: {
    marginRight: spacing[8],
  },
  rightIcon: {
    marginLeft: spacing[8],
  },
});
