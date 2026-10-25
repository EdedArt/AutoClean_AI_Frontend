import React from 'react';
import { StyleSheet, Text, TextProps, TextStyle } from 'react-native';

import { typography } from '@/theme/tokens';
import { useTheme } from '@/theme';

export type TextVariant = 'display' | 'title' | 'subtitle' | 'body' | 'caption';
export type TextWeight = 'regular' | 'medium' | 'semiBold' | 'bold';

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  weight?: TextWeight;
  color?: string;
  muted?: boolean;
  style?: TextStyle | TextStyle[];
  children?: React.ReactNode;
}

export function AppText({
  variant = 'body',
  weight,
  color,
  muted = false,
  style,
  children,
  ...rest
}: AppTextProps) {
  const { colors } = useTheme();

  const variantStyle = typography[variant];
  const textColor = color ?? (muted ? colors.textMuted : colors.text);

  let fontFamily = variantStyle.fontFamily;
  if (weight) {
    fontFamily = typography.fonts[weight];
  }

  return (
    <Text
      style={[
        styles.base,
        variantStyle,
        {
          color: textColor,
          fontFamily,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
  },
});
