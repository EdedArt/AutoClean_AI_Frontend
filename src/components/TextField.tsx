import React, { useState } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';

import { AppIconName, Icon } from './Icon';
import { radius, spacing, typography } from '@/theme/tokens';
import { useTheme } from '@/theme';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  helperText?: string;
  errorText?: string;
  rightIcon?: AppIconName;
  onRightIconPress?: () => void;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  maxLength?: number;
  showCounter?: boolean;
}

export function TextField({
  label,
  helperText,
  errorText,
  rightIcon,
  onRightIconPress,
  style,
  containerStyle,
  maxLength,
  showCounter = false,
  value,
  onChangeText,
  editable = true,
  ...rest
}: TextFieldProps) {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const hasError = Boolean(errorText);
  const currentLength = value?.length ?? 0;

  let borderColor = colors.border;
  if (hasError) {
    borderColor = colors.danger;
  } else if (isFocused) {
    borderColor = colors.primary;
  }

  const backgroundColor = editable ? colors.surface : colors.readOnlyBackground;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <Text
          style={[
            styles.label,
            {
              color: hasError ? colors.danger : colors.text,
              fontFamily: typography.fonts.medium,
            },
          ]}
        >
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor,
            borderColor,
            borderWidth: isFocused || hasError ? 1.5 : 1,
            borderRadius: radius[12],
          },
          style,
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          editable={editable}
          maxLength={maxLength}
          placeholderTextColor={colors.textMuted}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[
            styles.input,
            {
              color: colors.text,
              fontFamily: typography.fonts.regular,
            },
          ]}
          accessibilityLabel={label}
          accessibilityRole="none"
          {...rest}
        />

        {rightIcon && (
          <Pressable
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            hitSlop={8}
            style={styles.rightIconButton}
            accessibilityRole={onRightIconPress ? 'button' : 'none'}
          >
            <Icon name={rightIcon} size={20} color={hasError ? colors.danger : colors.textMuted} />
          </Pressable>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.messageContainer}>
          {hasError ? (
            <Text
              style={[
                styles.helperText,
                { color: colors.danger, fontFamily: typography.fonts.regular },
              ]}
            >
              {errorText}
            </Text>
          ) : helperText ? (
            <Text
              style={[
                styles.helperText,
                { color: colors.textMuted, fontFamily: typography.fonts.regular },
              ]}
            >
              {helperText}
            </Text>
          ) : null}
        </View>

        {showCounter && maxLength !== undefined && (
          <Text
            style={[
              styles.counterText,
              { color: colors.textMuted, fontFamily: typography.fonts.regular },
            ]}
          >
            {currentLength}/{maxLength}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: spacing[12],
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: spacing[12],
  },
  input: {
    flex: 1,
    minHeight: 48,
    fontSize: 15,
    paddingVertical: spacing[12],
  },
  rightIconButton: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 32,
    minHeight: 32,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 2,
  },
  messageContainer: {
    flex: 1,
  },
  helperText: {
    fontSize: 12,
  },
  counterText: {
    fontSize: 12,
    marginLeft: 8,
  },
});
