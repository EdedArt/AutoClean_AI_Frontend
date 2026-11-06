import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ApiError, hasReachedBackend } from '@/api/client';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ConnectingBanner } from '@/components/ConnectingBanner';
import { Icon } from '@/components/Icon';
import { Logo } from '@/components/Logo';
import { ScreenContainer } from '@/components/ScreenContainer';
import { TextField, TextFieldInstance } from '@/components/TextField';
import { useAuth } from '@/features/auth';
import { loginSchema } from '@/lib/validation';
import { radius, spacing, withAlpha } from '@/theme/tokens';
import { useTheme } from '@/theme';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isConnectingSlow, setIsConnectingSlow] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const passwordRef = useRef<TextFieldInstance>(null);
  const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (slowTimerRef.current) {
        clearTimeout(slowTimerRef.current);
      }
    };
  }, []);

  const validate = (
    currentEmail: string,
    currentPassword: string,
  ): {
    isValid: boolean;
    errors: { email?: string; password?: string };
    data: { email: string; password: string } | null;
  } => {
    const result = loginSchema.safeParse({
      email: currentEmail.trim(),
      password: currentPassword,
    });

    if (!result.success) {
      const errors: { email?: string; password?: string } = {};
      for (const issue of result.error.issues) {
        const fieldName = issue.path[0] as 'email' | 'password';
        if (fieldName && !errors[fieldName]) {
          errors[fieldName] = issue.message;
        }
      }
      return { isValid: false, errors, data: null };
    }

    return { isValid: true, errors: {}, data: result.data };
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (submitted) {
      const { errors } = validate(text, password);
      setFieldErrors((prev) => ({ ...prev, email: errors.email }));
    }
  };

  const handleEmailBlur = () => {
    if (submitted || email.length > 0) {
      const { errors } = validate(email, password);
      setFieldErrors((prev) => ({ ...prev, email: errors.email }));
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (submitted) {
      const { errors } = validate(email, text);
      setFieldErrors((prev) => ({ ...prev, password: errors.password }));
    }
  };

  const handlePasswordBlur = () => {
    if (submitted || password.length > 0) {
      const { errors } = validate(email, password);
      setFieldErrors((prev) => ({ ...prev, password: errors.password }));
    }
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    setGeneralError(null);
    setIsConnectingSlow(false);

    if (slowTimerRef.current) {
      clearTimeout(slowTimerRef.current);
      slowTimerRef.current = null;
    }

    const { isValid, errors, data } = validate(email, password);
    setFieldErrors(errors);

    if (!isValid || !data) {
      return;
    }

    setLoading(true);

    slowTimerRef.current = setTimeout(() => {
      if (!hasReachedBackend()) {
        setIsConnectingSlow(true);
      }
    }, 5000);

    try {
      await signIn({
        email: data.email,
        password: data.password,
      });
      setIsConnectingSlow(false);
    } catch (err: unknown) {
      setIsConnectingSlow(false);
      setLoading(false);
      if (err instanceof ApiError) {
        if (err.code === 'INVALID_CREDENTIALS' || err.status === 401) {
          setGeneralError(t('auth.invalidCredentials'));
          return;
        }
        if (err.code === 'RATE_LIMITED' || err.status === 429) {
          setGeneralError(t('auth.rateLimited'));
          return;
        }
        if (err.code === 'NETWORK_ERROR') {
          setGeneralError(t('auth.networkError'));
          return;
        }
        setGeneralError(err.message || t('auth.loginError'));
        return;
      }

      setGeneralError(t('auth.networkError'));
    } finally {
      if (slowTimerRef.current) {
        clearTimeout(slowTimerRef.current);
        slowTimerRef.current = null;
      }
    }
  };

  return (
    <ScreenContainer scroll contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Logo size={52} variant="full" />
        <AppText variant="title" weight="bold" style={styles.title}>
          {t('auth.welcome')}
        </AppText>
        <AppText variant="caption" color="textMuted" style={styles.subtitle}>
          {t('auth.loginSubtitle')}
        </AppText>
      </View>

      <Card variant="elevated" style={styles.formCard}>
        {isConnectingSlow ? (
          <View style={styles.bannerWrapper}>
            <ConnectingBanner />
          </View>
        ) : generalError ? (
          <View
            style={[
              styles.alertBox,
              {
                backgroundColor: withAlpha(colors.danger, isDark ? 0.16 : 0.08),
                borderColor: withAlpha(colors.danger, isDark ? 0.4 : 0.28),
              },
            ]}
            accessibilityRole="alert"
          >
            <Icon name="AlertCircle" size={18} color={colors.danger} />
            <AppText variant="caption" color="danger" style={styles.alertText}>
              {generalError}
            </AppText>
          </View>
        ) : null}

        <TextField
          label={t('auth.email')}
          placeholder={t('auth.emailPlaceholder')}
          value={email}
          onChangeText={handleEmailChange}
          onBlur={handleEmailBlur}
          errorText={fieldErrors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          maxLength={100}
          showCounter
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />

        <TextField
          ref={passwordRef}
          label={t('auth.password')}
          placeholder={t('auth.passwordPlaceholder')}
          value={password}
          onChangeText={handlePasswordChange}
          onBlur={handlePasswordBlur}
          errorText={fieldErrors.password}
          secureTextEntry={!showPassword}
          maxLength={12}
          rightIcon={showPassword ? 'EyeOff' : 'Eye'}
          onRightIconPress={() => setShowPassword((prev) => !prev)}
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />

        <Button
          title={t('auth.login')}
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          onPress={handleSubmit}
          style={styles.submitButton}
        />
      </Card>

      <View style={styles.footer}>
        <AppText variant="body" color="textMuted">
          {t('auth.noAccount')}{' '}
        </AppText>
        <Link href="/(auth)/register" asChild>
          <Pressable hitSlop={8} accessibilityRole="link" style={styles.footerLinkTouch}>
            <AppText variant="body" color="primary" style={styles.linkText}>
              {t('auth.signUp')}
            </AppText>
          </Pressable>
        </Link>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing[24],
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing[24],
  },
  title: {
    marginTop: spacing[16],
    marginBottom: spacing[4],
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: 320,
    marginTop: spacing[4],
  },
  formCard: {
    width: '100%',
    padding: spacing[20],
    marginBottom: spacing[16],
  },
  bannerWrapper: {
    marginBottom: spacing[16],
    width: '100%',
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius[12],
    padding: spacing[12],
    marginBottom: spacing[16],
    gap: spacing[8],
  },
  alertText: {
    flex: 1,
    lineHeight: 18,
  },
  submitButton: {
    marginTop: spacing[8],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing[4],
  },
  footerLinkTouch: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing[4],
  },
  linkText: {
    fontWeight: '600',
  },
});
