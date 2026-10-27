import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';

import { useTheme } from '@/theme';
import { WashPhaseCode } from '@/theme/tokens';

export interface CarIllustrationProps {
  phase: WashPhaseCode;
}

export function CarIllustration({ phase: _phase }: CarIllustrationProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container} accessible accessibilityRole="image">
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

        {/* Car Main Body Group */}
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
          {/* Front / Windshield Window */}
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

          {/* Rear Window */}
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
          <Line
            x1="145"
            y1="53"
            x2="145"
            y2="106"
            stroke={colors.border}
            strokeWidth="1.5"
          />

          {/* Door Handle */}
          <Rect
            x="152"
            y="84"
            width="12"
            height="3"
            rx="1.5"
            fill={colors.onPrimary}
          />

          {/* Headlight (front right) */}
          <Path
            d="M 242 84 L 250 86 L 247 92 L 240 90 Z"
            fill={colors.warning}
          />

          {/* Taillight (rear left) */}
          <Path
            d="M 33 86 L 39 85 L 39 92 L 32 91 Z"
            fill={colors.danger}
          />

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
  svg: {
    width: 240,
    height: 120,
  },
});
