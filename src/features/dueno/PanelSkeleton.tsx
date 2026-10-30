import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';

export interface PanelSkeletonProps {
  rows?: number;
}

export function PanelSkeleton({ rows = 3 }: PanelSkeletonProps) {
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

  const items = Array.from({ length: rows }, (_, i) => i);

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Cargando órdenes activas del panel"
    >
      {items.map((idx) => (
        <Animated.View
          key={idx}
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              opacity: pulseAnim,
            },
          ]}
        >
          <View style={styles.topRow}>
            <View>
              <View style={[styles.platePlaceholder, { backgroundColor: colors.surfaceAlt }]} />
              <View style={[styles.vehiclePlaceholder, { backgroundColor: colors.surfaceAlt }]} />
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
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius[16],
    borderWidth: 1,
    padding: spacing[16],
    marginBottom: spacing[12],
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[12],
  },
  platePlaceholder: {
    width: 100,
    height: 20,
    borderRadius: radius[8],
    marginBottom: 6,
  },
  vehiclePlaceholder: {
    width: 148,
    height: 13,
    borderRadius: radius[8],
  },
  badgePlaceholder: {
    width: 82,
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
    width: 64,
    height: 12,
    borderRadius: radius[8],
  },
  etaPlaceholder: {
    width: 96,
    height: 12,
    borderRadius: radius[8],
  },
});
