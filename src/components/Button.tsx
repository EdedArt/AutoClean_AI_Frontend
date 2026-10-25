import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import { AppIconName, Icon } from './Icon';
import { radius, spacing, typography } from '@/theme/tokens';
import { useTheme } from '@/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: AppIconName;
  rightIcon?: AppIconName;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  style,
  accessibilityLabel,
  accessibilityHint,
}: ButtonProps) {
  const { colors, isDark } = useTheme();

  const isInteractive = !disabled && !loading;

  // Background and border colors per variant
  let backgroundColor: string;
  let textColor: string;
  let borderColor: string | undefined;

  switch (variant) {
    case 'primary':
      backgroundColor = disabled ? (isDark ? '#1E293B' : '#E2E8F0') : colors.primary;
      textColor = disabled ? (isDark ? '#64748B' : '#94A3B8') : colors.onPrimary;
      break;
    case 'secondary':
      backgroundColor = disabled ? 'transparent' : colors.surfaceAlt;
      textColor = disabled ? (isDark ? '#64748B' : '#94A3B8') : colors.text;
      borderColor = disabled ? (isDark ? '#24324A' : '#E2E8F0') : colors.border;
      break;
    case 'ghost':
      backgroundColor = 'transparent';
      textColor = disabled ? (isDark ? '#64748B' : '#94A3B8') : colors.primary;
      break;
  }

  // Padding & height per size, minimum touch target is 44
  let minHeight = 44;
  let paddingHorizontal: number = spacing[16];
  let fontSize = 15;
  let iconSize: 16 | 20 | 24 | 32 = 20;

  if (size === 'sm') {
    minHeight = 44;
    paddingHorizontal = spacing[12];
    fontSize = 13;
    iconSize = 16;
  } else if (size === 'lg') {
    minHeight = 52;
    paddingHorizontal = spacing[24];
    fontSize = 17;
    iconSize = 24;
  }

  return (
    <Pressable
      onPress={isInteractive ? onPress : undefined}
      disabled={!isInteractive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{
        disabled: !isInteractive,
        busy: loading,
      }}
      style={({ pressed }) => [
        styles.button,
        {
          minHeight,
          minWidth: 44,
          paddingHorizontal,
          backgroundColor,
          borderColor,
          borderWidth: borderColor ? 1 : 0,
          borderRadius: radius[12],
          opacity: pressed && isInteractive ? 0.8 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <View style={styles.content}>
          {leftIcon && (
            <Icon name={leftIcon} size={iconSize} color={textColor} style={styles.leftIcon} />
          )}
          <Text
            style={[
              styles.text,
              {
                color: textColor,
                fontSize,
                fontFamily: typography.fonts.semiBold,
              },
            ]}
          >
            {title}
          </Text>
          {rightIcon && (
            <Icon name={rightIcon} size={iconSize} color={textColor} style={styles.rightIcon} />
          )}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
});
