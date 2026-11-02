import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { AppText } from '@/components/AppText';
import { Icon } from '@/components/Icon';
import { useTheme, withAlpha } from '@/theme';
import { radius, spacing } from '@/theme/tokens';

export interface ConnectingBannerProps {
  style?: StyleProp<ViewStyle>;
}

export const CONNECTING_SERVER_MESSAGE =
  'Conectando con el servidor… la primera conexión puede tardar hasta un minuto.';

export function ConnectingBanner({ style }: ConnectingBannerProps) {
  const { colors, isDark } = useTheme();
  const [reduceMotion, setReduceMotion] = useState(false);
  const [fadeAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) {
          setReduceMotion(enabled);
          if (enabled) {
            fadeAnim.setValue(1);
          }
        }
      })
      .catch(() => {});

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      if (mounted) {
        setReduceMotion(enabled);
        if (enabled) {
          fadeAnim.setValue(1);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, [fadeAnim]);

  useEffect(() => {
    if (reduceMotion) {
      fadeAnim.setValue(1);
    } else {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [fadeAnim, reduceMotion]);

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          opacity: fadeAnim,
          backgroundColor: withAlpha(colors.info, isDark ? 0.16 : 0.08),
          borderColor: withAlpha(colors.info, isDark ? 0.4 : 0.28),
        },
        style,
      ]}
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      pointerEvents="box-none"
    >
      <View style={styles.iconContainer}>
        <Icon name="Clock" size={18} color={colors.info} />
      </View>
      <AppText variant="caption" style={[styles.text, { color: colors.info }]}>
        {CONNECTING_SERVER_MESSAGE}
      </AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[12],
    borderRadius: radius[12],
    borderWidth: 1,
    width: '100%',
  },
  iconContainer: {
    marginRight: spacing[8],
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    flex: 1,
    lineHeight: 18,
  },
});
