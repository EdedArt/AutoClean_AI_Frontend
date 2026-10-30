import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';

export interface HistorySkeletonProps {
  rows?: number;
}

export function HistorySkeleton({ rows = 3 }: HistorySkeletonProps) {
  const { colors } = useTheme();
  const [reduceMotion, setReduceMotion] = useState(false);
  const [pulseAnim] = useState(() => new Animated.Value(0.6));

  useEffect(() => {
    let isMounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (isMounted) {
          setReduceMotion(enabled);
        }
      })
      .catch(() => {});

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      setReduceMotion(enabled);
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.55,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();

    return () => {
      loop.stop();
    };
  }, [pulseAnim, reduceMotion]);

  const indices = Array.from({ length: rows }, (_, idx) => idx);

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Cargando historial de búsquedas recientes"
    >
      {indices.map((index) => (
        <Animated.View
          key={index}
          style={[
            styles.row,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              opacity: pulseAnim,
            },
          ]}
        >
          <View style={styles.contentColumn}>
            <View style={styles.topRow}>
              <View>
                <View style={[styles.platePlaceholder, { backgroundColor: colors.surfaceAlt }]} />
                <View
                  style={[styles.subtitlePlaceholder, { backgroundColor: colors.surfaceAlt }]}
                />
              </View>
              <View style={[styles.badgePlaceholder, { backgroundColor: colors.surfaceAlt }]} />
            </View>

            <View
              style={[styles.progressPlaceholder, { backgroundColor: colors.disabledBackground }]}
            />

            <View style={styles.bottomRow}>
              <View style={[styles.percentPlaceholder, { backgroundColor: colors.surfaceAlt }]} />
              <View style={[styles.etaPlaceholder, { backgroundColor: colors.surfaceAlt }]} />
            </View>
          </View>

          <View style={[styles.trashColumn, { borderLeftColor: colors.border }]}>
            <View style={[styles.iconPlaceholder, { backgroundColor: colors.surfaceAlt }]} />
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: radius[16],
    borderWidth: 1,
    marginBottom: spacing[12],
    overflow: 'hidden',
  },
  contentColumn: {
    flex: 1,
    paddingVertical: spacing[12],
    paddingLeft: spacing[16],
    paddingRight: spacing[12],
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[12],
  },
  platePlaceholder: {
    width: 96,
    height: 20,
    borderRadius: radius[8],
    marginBottom: 6,
  },
  subtitlePlaceholder: {
    width: 140,
    height: 13,
    borderRadius: radius[8],
  },
  badgePlaceholder: {
    width: 78,
    height: 24,
    borderRadius: radius.pill,
  },
  progressPlaceholder: {
    width: '100%',
    height: 6,
    borderRadius: radius.pill,
    marginBottom: spacing[8],
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  percentPlaceholder: {
    width: 36,
    height: 12,
    borderRadius: radius[8],
  },
  etaPlaceholder: {
    width: 88,
    height: 12,
    borderRadius: radius[8],
  },
  trashColumn: {
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    paddingHorizontal: spacing[12],
  },
  iconPlaceholder: {
    width: 18,
    height: 18,
    borderRadius: radius[8],
  },
});
