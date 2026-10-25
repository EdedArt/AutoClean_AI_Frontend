import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';

import { radius, shadows, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme';

export interface CardProps extends ViewProps {
  onPress?: () => void;
  variant?: 'elevated' | 'outlined' | 'flat';
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export function Card({
  onPress,
  variant = 'elevated',
  style,
  children,
  ...rest
}: CardProps) {
  const { colors, isDark } = useTheme();

  const isInteractive = typeof onPress === 'function';

  let containerStyle: ViewStyle = {
    backgroundColor: colors.surface,
    borderRadius: radius[16],
    padding: spacing[16],
  };

  if (variant === 'elevated') {
    containerStyle = {
      ...containerStyle,
      ...(isDark
        ? {
            borderWidth: 1,
            borderColor: colors.border,
          }
        : shadows.sm),
    };
  } else if (variant === 'outlined') {
    containerStyle = {
      ...containerStyle,
      borderWidth: 1,
      borderColor: colors.border,
    };
  } else if (variant === 'flat') {
    containerStyle = {
      ...containerStyle,
      backgroundColor: colors.surfaceAlt,
    };
  }

  if (isInteractive) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.base,
          containerStyle,
          { opacity: pressed ? 0.9 : 1 },
          style,
        ]}
        {...rest}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={[styles.base, containerStyle, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});
