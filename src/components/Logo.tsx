import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { typography } from '@/theme/tokens';
import { useTheme } from '@/theme';

export interface LogoProps {
  size?: number;
  variant?: 'mark' | 'full';
  color?: string;
  accentColor?: string;
  style?: ViewStyle;
}

export function Logo({ size = 40, variant = 'full', color, accentColor, style }: LogoProps) {
  const { colors } = useTheme();

  const primaryColor = color ?? colors.primary;
  const dropletColor = accentColor ?? colors.accent;
  const textColor = colors.text;

  // ViewBox: 0 0 100 60
  const svgWidth = size;
  const svgHeight = Math.round(size * 0.6);

  const iconElement = (
    <Svg
      width={svgWidth}
      height={svgHeight}
      viewBox="0 0 100 60"
      fill="none"
      accessibilityRole="image"
      accessibilityLabel="Logo AutoClean AI"
    >
      {/* Water drop in accent color */}
      <Path
        d="M 52 3 C 52 3 46 11 46 15 C 46 18.3 48.7 21 52 21 C 55.3 21 58 18.3 58 15 C 58 11 52 3 52 3 Z"
        fill={dropletColor}
      />

      {/* Car Silhouette Body */}
      <Path
        d="M 8 44 C 6 40 7 35 12 34 L 25 33 C 31 33 39 23 45 22 L 65 22 C 70 22 77 30 81 32 L 91 33 C 95 34 96 39 94 44 L 86 44 A 9 9 0 0 0 68 44 L 38 44 A 9 9 0 0 0 20 44 Z"
        fill={primaryColor}
      />

      {/* Front Window Cutout */}
      <Path d="M 64 25 L 54 25 L 54 32 L 74 32 C 71 28 67 25 64 25 Z" fill={colors.surface} />

      {/* Rear Window Cutout */}
      <Path d="M 51 25 L 45 25 C 41 26 35 31 33 32 L 51 32 Z" fill={colors.surface} />

      {/* Rear Wheel */}
      <Circle cx="29" cy="44" r="8" fill={primaryColor} />
      <Circle cx="29" cy="44" r="4.5" fill={colors.surface} />
      <Circle cx="29" cy="44" r="2" fill={primaryColor} />

      {/* Front Wheel */}
      <Circle cx="77" cy="44" r="8" fill={primaryColor} />
      <Circle cx="77" cy="44" r="4.5" fill={colors.surface} />
      <Circle cx="77" cy="44" r="2" fill={primaryColor} />
    </Svg>
  );

  if (variant === 'mark') {
    return <View style={style}>{iconElement}</View>;
  }

  const titleFontSize = Math.max(16, Math.round(size * 0.45));
  const aiBadgeFontSize = Math.max(11, Math.round(titleFontSize * 0.65));

  return (
    <View style={[styles.container, style]}>
      {iconElement}
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: textColor, fontSize: titleFontSize }]}>AutoClean</Text>
        <View style={[styles.aiBadge, { backgroundColor: primaryColor }]}>
          <Text style={[styles.aiText, { color: colors.onPrimary, fontSize: aiBadgeFontSize }]}>
            AI
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontFamily: typography.fonts.bold,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  aiBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiText: {
    fontFamily: typography.fonts.bold,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
