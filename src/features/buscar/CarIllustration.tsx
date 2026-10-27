import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  AppState,
  type AppStateStatus,
  Easing,
  StyleSheet,
  View,
} from 'react-native';
import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';
import { useIsFocused } from 'expo-router';

import { Icon } from '@/components/Icon';
import { useTheme } from '@/theme';
import { WashPhaseCode } from '@/theme/tokens';

export interface CarIllustrationProps {
  phase: WashPhaseCode;
}

export function CarIllustration({ phase }: CarIllustrationProps) {
  const { colors, phaseColors } = useTheme();
  const isScreenFocused = useIsFocused();
  const [reduceMotion, setReduceMotion] = useState(false);
  const [appState, setAppState] = useState<AppStateStatus>(
    () => (AppState.currentState as AppStateStatus) || 'active',
  );

  // Animated values for phase effects
  const waterAnim = useRef(new Animated.Value(0)).current;
  const foamAnim = useRef(new Animated.Value(0)).current;
  const windAnim = useRef(new Animated.Value(0)).current;
  const listoAnim = useRef(new Animated.Value(0)).current;

  // Listen to reduce-motion accessibility settings
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

  // Listen to AppState (foreground / background)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      setAppState(nextState);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const isAppActive = appState === 'active';
  const shouldAnimate = !reduceMotion && isScreenFocused && isAppActive;

  // Manage animations based on phase and active state
  useEffect(() => {
    if (!shouldAnimate) {
      waterAnim.stopAnimation();
      foamAnim.stopAnimation();
      windAnim.stopAnimation();
      listoAnim.stopAnimation();
      return;
    }

    let activeAnimation: Animated.CompositeAnimation | null = null;

    if (phase === 'REMOJO') {
      waterAnim.setValue(0);
      activeAnimation = Animated.loop(
        Animated.timing(waterAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      activeAnimation.start();
    } else if (phase === 'LAVADO') {
      foamAnim.setValue(0);
      activeAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(foamAnim, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(foamAnim, {
            toValue: 0,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      activeAnimation.start();
    } else if (phase === 'SECADO') {
      windAnim.setValue(0);
      activeAnimation = Animated.loop(
        Animated.timing(windAnim, {
          toValue: 1,
          duration: 1400,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      activeAnimation.start();
    } else if (phase === 'LISTO') {
      listoAnim.setValue(0);
      activeAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(listoAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(listoAnim, {
            toValue: 0,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      activeAnimation.start();
    }

    return () => {
      if (activeAnimation) {
        activeAnimation.stop();
      }
    };
  }, [phase, shouldAnimate, waterAnim, foamAnim, windAnim, listoAnim]);

  // Interpolations for water drops (REMOJO)
  const drop1TranslateY = waterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 24],
  });
  const drop2TranslateY = waterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-6, 26],
  });
  const drop3TranslateY = waterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-3, 25],
  });
  const waterOpacity = waterAnim.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0, 1, 1, 0],
  });

  // Interpolations for foam bubbles (LAVADO)
  const foamScale = foamAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1.2],
  });
  const foamScaleAlt = foamAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1.15, 0.85],
  });

  // Interpolations for air lines (SECADO)
  const windTranslateX = windAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [30, -35],
  });
  const windOpacity = windAnim.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0, 1, 1, 0],
  });

  // Interpolations for check mark badge (LISTO)
  const listoScale = listoAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  return (
    <View style={styles.container} accessible accessibilityRole="image">
      <View style={styles.canvas}>
        <Svg viewBox="0 0 280 140" style={styles.svg}>
          {/* Ground shadow / road line */}
          <Line
            x1="20"
            y1="126"
            x2="260"
            y2="126"
            stroke={colors.border}
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Car Main Body */}
          <G>
            {/* Lower Car Chassis / Body */}
            <Path
              d="M 38 108 
                 L 32 98 
                 C 30 92, 34 84, 42 82 
                 L 65 80 
                 L 92 56 
                 C 98 50, 108 48, 120 48 
                 L 182 48 
                 C 192 48, 202 54, 210 64 
                 L 228 80 
                 L 242 82 
                 C 248 83, 252 88, 252 94 
                 L 248 108 
                 C 246 110, 240 110, 236 108 
                 C 230 96, 218 88, 204 88 
                 C 190 88, 178 96, 172 108 
                 L 108 108 
                 C 102 96, 90 88, 76 88 
                 C 62 88, 50 96, 44 108 
                 Z"
              fill={colors.primary}
              stroke={colors.border}
              strokeWidth="1.5"
            />

            {/* Cabin Glass / Windows */}
            <Path
              d="M 122 53 
                 L 99 78 
                 L 142 78 
                 L 142 53 
                 Z"
              fill={colors.surfaceAlt}
              stroke={colors.border}
              strokeWidth="1"
            />

            <Path
              d="M 148 53 
                 L 148 78 
                 L 218 78 
                 L 202 56 
                 C 196 54, 190 53, 184 53 
                 Z"
              fill={colors.surfaceAlt}
              stroke={colors.border}
              strokeWidth="1"
            />

            {/* Door line divider */}
            <Line x1="145" y1="53" x2="145" y2="106" stroke={colors.border} strokeWidth="1.5" />

            {/* Door Handle */}
            <Rect x="152" y="84" width="12" height="3" rx="1.5" fill={colors.onPrimary} />

            {/* Headlight */}
            <Path d="M 242 84 L 250 86 L 247 92 L 240 90 Z" fill={colors.warning} />

            {/* Taillight */}
            <Path d="M 33 86 L 39 85 L 39 92 L 32 91 Z" fill={colors.danger} />

            {/* Front Wheel (right) */}
            <Circle cx="204" cy="106" r="18" fill={colors.text} />
            <Circle cx="204" cy="106" r="11" fill={colors.surfaceAlt} />
            <Circle cx="204" cy="106" r="5" fill={colors.border} />

            {/* Rear Wheel (left) */}
            <Circle cx="76" cy="106" r="18" fill={colors.text} />
            <Circle cx="76" cy="106" r="11" fill={colors.surfaceAlt} />
            <Circle cx="76" cy="106" r="5" fill={colors.border} />
          </G>
        </Svg>

        {/* --- PHASE OVERLAYS --- */}

        {/* 1. EN ESPERA (PENDIENTE): Static small clock */}
        {phase === 'PENDIENTE' && (
          <View
            style={[
              styles.effectBadge,
              styles.clockPosition,
              {
                backgroundColor: phaseColors.PENDIENTE.bg,
                borderColor: phaseColors.PENDIENTE.border,
              },
            ]}
          >
            <Icon name="Clock" size={16} color={phaseColors.PENDIENTE.main} />
          </View>
        )}

        {/* 2. REMOJO: Gentle water drops */}
        {phase === 'REMOJO' && (
          <View pointerEvents="none" style={styles.overlayContainer}>
            <Animated.View
              style={[
                styles.drop,
                {
                  left: 85,
                  top: 14,
                  opacity: shouldAnimate ? waterOpacity : 0.9,
                  transform: shouldAnimate ? [{ translateY: drop1TranslateY }] : [],
                },
              ]}
            >
              <Icon name="Droplets" size={16} color={phaseColors.REMOJO.main} />
            </Animated.View>
            <Animated.View
              style={[
                styles.drop,
                {
                  left: 125,
                  top: 8,
                  opacity: shouldAnimate ? waterOpacity : 0.9,
                  transform: shouldAnimate ? [{ translateY: drop2TranslateY }] : [],
                },
              ]}
            >
              <Icon name="Droplets" size={18} color={phaseColors.REMOJO.main} />
            </Animated.View>
            <Animated.View
              style={[
                styles.drop,
                {
                  left: 165,
                  top: 16,
                  opacity: shouldAnimate ? waterOpacity : 0.9,
                  transform: shouldAnimate ? [{ translateY: drop3TranslateY }] : [],
                },
              ]}
            >
              <Icon name="Droplets" size={15} color={phaseColors.REMOJO.main} />
            </Animated.View>
          </View>
        )}

        {/* 3. ENJABONADO (LAVADO): Foam bubbles */}
        {phase === 'LAVADO' && (
          <View pointerEvents="none" style={styles.overlayContainer}>
            <Animated.View
              style={[
                styles.bubbleGroup,
                {
                  left: 95,
                  top: 32,
                  transform: shouldAnimate ? [{ scale: foamScale }] : [],
                },
              ]}
            >
              <View
                style={[
                  styles.bubble,
                  styles.bubbleLg,
                  {
                    backgroundColor: phaseColors.LAVADO.bg,
                    borderColor: phaseColors.LAVADO.border,
                  },
                ]}
              />
            </Animated.View>

            <Animated.View
              style={[
                styles.bubbleGroup,
                {
                  left: 140,
                  top: 30,
                  transform: shouldAnimate ? [{ scale: foamScaleAlt }] : [],
                },
              ]}
            >
              <View
                style={[
                  styles.bubble,
                  styles.bubbleSm,
                  {
                    backgroundColor: phaseColors.LAVADO.bg,
                    borderColor: phaseColors.LAVADO.border,
                  },
                ]}
              />
            </Animated.View>

            <Animated.View
              style={[
                styles.bubbleGroup,
                {
                  left: 180,
                  top: 55,
                  transform: shouldAnimate ? [{ scale: foamScale }] : [],
                },
              ]}
            >
              <View
                style={[
                  styles.bubble,
                  styles.bubbleMd,
                  {
                    backgroundColor: phaseColors.LAVADO.bg,
                    borderColor: phaseColors.LAVADO.border,
                  },
                ]}
              />
            </Animated.View>
          </View>
        )}

        {/* 4. SECADO: Air lines */}
        {phase === 'SECADO' && (
          <View pointerEvents="none" style={styles.overlayContainer}>
            <Animated.View
              style={[
                styles.windStream,
                {
                  top: 36,
                  left: 100,
                  width: 50,
                  opacity: shouldAnimate ? windOpacity : 0.8,
                  transform: shouldAnimate ? [{ translateX: windTranslateX }] : [],
                },
              ]}
            >
              <View
                style={[styles.windLine, { backgroundColor: phaseColors.SECADO.main, width: 45 }]}
              />
            </Animated.View>

            <Animated.View
              style={[
                styles.windStream,
                {
                  top: 52,
                  left: 140,
                  width: 60,
                  opacity: shouldAnimate ? windOpacity : 0.8,
                  transform: shouldAnimate ? [{ translateX: windTranslateX }] : [],
                },
              ]}
            >
              <View
                style={[styles.windLine, { backgroundColor: phaseColors.SECADO.main, width: 55 }]}
              />
            </Animated.View>

            <Animated.View
              style={[
                styles.windStream,
                {
                  top: 70,
                  left: 70,
                  width: 40,
                  opacity: shouldAnimate ? windOpacity : 0.8,
                  transform: shouldAnimate ? [{ translateX: windTranslateX }] : [],
                },
              ]}
            >
              <View
                style={[styles.windLine, { backgroundColor: phaseColors.SECADO.main, width: 35 }]}
              />
            </Animated.View>
          </View>
        )}

        {/* 5. LISTO: Check mark */}
        {phase === 'LISTO' && (
          <Animated.View
            style={[
              styles.effectBadge,
              styles.listoPosition,
              {
                backgroundColor: phaseColors.LISTO.bg,
                borderColor: phaseColors.LISTO.border,
                transform: shouldAnimate ? [{ scale: listoScale }] : [],
              },
            ]}
          >
            <Icon name="CircleCheck" size={22} color={phaseColors.LISTO.main} strokeWidth={2.5} />
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  canvas: {
    width: 240,
    height: 120,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    width: 240,
    height: 120,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFill,
  },
  effectBadge: {
    position: 'absolute',
    borderRadius: 9999,
    borderWidth: 1.5,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockPosition: {
    top: 14,
    right: 32,
  },
  listoPosition: {
    top: 12,
    right: 28,
  },
  drop: {
    position: 'absolute',
  },
  bubbleGroup: {
    position: 'absolute',
  },
  bubble: {
    borderRadius: 9999,
    borderWidth: 1.5,
  },
  bubbleSm: {
    width: 10,
    height: 10,
  },
  bubbleMd: {
    width: 14,
    height: 14,
  },
  bubbleLg: {
    width: 18,
    height: 18,
  },
  windStream: {
    position: 'absolute',
    height: 3,
  },
  windLine: {
    height: 2.5,
    borderRadius: 1.5,
  },
});
