import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from './Icon';
import { radius, spacing, typography } from '@/theme/tokens';
import { useTheme } from '@/theme';

export interface ThemeToggleProps {
  showLabel?: boolean;
}

export function ThemeToggle({ showLabel = true }: ThemeToggleProps) {
  const { isDark, toggleTheme, colors } = useTheme();

  return (
    <Pressable
      onPress={toggleTheme}
      accessibilityRole="switch"
      accessibilityLabel={`Cambiar a modo ${isDark ? 'claro' : 'oscuro'}`}
      accessibilityState={{ checked: isDark }}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: colors.surfaceAlt,
          borderColor: colors.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: isDark ? colors.surface : colors.primary,
          },
        ]}
      >
        <Icon
          name={isDark ? 'Moon' : 'Sun'}
          size={18}
          color={isDark ? colors.primary : colors.onPrimary}
        />
      </View>
      {showLabel && (
        <Text
          style={[
            styles.label,
            {
              color: colors.text,
              fontFamily: typography.fonts.medium,
            },
          ]}
        >
          {isDark ? 'Modo Oscuro' : 'Modo Claro'}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: spacing[12],
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    gap: 8,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
});
