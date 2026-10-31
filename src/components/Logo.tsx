import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { ClipPath, Defs, G, Path, Rect } from 'react-native-svg';

import { spacing, typography } from '@/theme/tokens';
import { useTheme } from '@/theme';

export interface LogoProps {
  size?: number;
  variant?: 'full' | 'mark';
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export function Logo({ size = 40, variant = 'full', color, style }: LogoProps) {
  const { colors, isDark } = useTheme();

  const dropColor = color ?? colors.primary;
  const waveColor = colors.accent;
  const carColor = isDark ? colors.background : colors.onPrimary;
  const textColor = color ?? colors.text;

  const mark = (
    <Svg width={size} height={size} viewBox="0 0 512 512" fill="none">
      <Defs>
        <ClipPath id="autocleanDropClip">
          <Path d="M256 36c0 0 36 62 84 118 34 40 60 85 60 130a144 144 0 0 1-288 0c0-45 26-90 60-130 48-56 84-118 84-118z" />
        </ClipPath>
      </Defs>

      <G clipPath="url(#autocleanDropClip)">
        <Rect width="512" height="512" fill={dropColor} />
        <Path
          d="M112 392c40-26 72-26 112-8s80 20 128-10c24-15 44-22 60-22v180H112z"
          fill={waveColor}
        />
      </G>

      <G transform="translate(256 302) scale(1.34) translate(-256 -302)">
        <Path
          d="M210 250l14-28c4-8 12-12 21-12h22c9 0 17 4 21 12l14 28h8c10 0 18 8 18 18v24c0 6-5 10-10 10h-6v10c0 6-5 10-10 10h-8c-6 0-10-4-10-10v-10h-56v10c0 6-4 10-10 10h-8c-5 0-10-4-10-10v-10h-6c-5 0-10-4-10-10v-24c0-10 8-18 18-18h8z"
          fill={carColor}
        />
        <Path d="M222 250h68l-10-20c-2-4-6-6-11-6h-26c-5 0-9 2-11 6l-10 20z" fill={dropColor} />
        <Rect x="202" y="264" width="18" height="10" rx="5" fill={dropColor} />
        <Rect x="292" y="264" width="18" height="10" rx="5" fill={dropColor} />
      </G>

      <Path d="M308 160l8 21 21 8-21 8-8 21-8-21-21-8 21-8z" fill={carColor} />
    </Svg>
  );

  if (variant === 'mark') {
    return (
      <View
        style={[styles.markContainer, style]}
        accessible
        accessibilityRole="image"
        accessibilityLabel="AutoClean AI"
      >
        {mark}
      </View>
    );
  }

  const textSize = Math.round(size * 0.52);

  return (
    <View
      style={[styles.fullContainer, style]}
      accessible
      accessibilityRole="header"
      accessibilityLabel="AutoClean AI"
    >
      {mark}
      <View style={styles.wordmarkContainer}>
        <Text
          style={[
            styles.wordmarkText,
            {
              color: textColor,
              fontSize: textSize,
              fontFamily: typography.fonts.bold,
            },
          ]}
        >
          AutoClean{' '}
          <Text
            style={{
              color: dropColor,
              fontFamily: typography.fonts.bold,
            }}
          >
            AI
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  markContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordmarkContainer: {
    marginLeft: spacing[12],
  },
  wordmarkText: {
    fontWeight: '700',
    letterSpacing: -0.5,
  },
});
