import React from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

export interface ProgressBarProps {
  progress: number;
  color?: string;
  backgroundColor?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export function ProgressBar({
  progress,
  color,
  backgroundColor,
  height = 8,
  style,
}: ProgressBarProps) {
  const { colors, radius } = useTheme();

  const clampedProgress = Math.max(0, Math.min(100, Math.round(progress)));
  const fillColor = color ?? colors.primary;
  const trackColor = backgroundColor ?? colors.surfaceAlt;

  return (
    <View
      style={[
        styles.track,
        {
          height,
          backgroundColor: trackColor,
          borderRadius: radius.pill,
        },
        style,
      ]}
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: 100,
        now: clampedProgress,
      }}
      accessibilityLabel={`Progreso de lavado: ${clampedProgress}%`}
    >
      <View
        style={[
          styles.fill,
          {
            width: `${clampedProgress}%`,
            backgroundColor: fillColor,
            borderRadius: radius.pill,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
