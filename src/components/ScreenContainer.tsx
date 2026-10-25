import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';

import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme';

export interface ScreenContainerProps {
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  edges?: readonly Edge[];
  keyboardOffset?: number;
  children: React.ReactNode;
}

export function ScreenContainer({
  scroll = false,
  style,
  contentContainerStyle,
  edges = ['top', 'bottom', 'left', 'right'],
  keyboardOffset = Platform.OS === 'ios' ? 0 : 0,
  children,
}: ScreenContainerProps) {
  const { colors } = useTheme();

  const containerBgStyle = { backgroundColor: colors.background };

  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={styles.flex}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.staticContent, contentContainerStyle]}>{children}</View>
  );

  return (
    <SafeAreaView edges={edges} style={[styles.safeArea, containerBgStyle, style]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={keyboardOffset}
        style={styles.flex}
      >
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing[16],
  },
  staticContent: {
    flex: 1,
    padding: spacing[16],
  },
});
