import React, { useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Link } from 'expo-router';

import { ApiError } from '@/api/client';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Logo } from '@/components/Logo';
import { ScreenContainer } from '@/components/ScreenContainer';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/features/auth';
import { loginSchema } from '@/lib/validation';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme';

export default function LoginScreen() {
  const { colors } = useTheme();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const passwordRef = useRef<TextInput>(null);

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

    const { isValid, errors, data } = validate(email, password);
    setFieldErrors(errors);

    if (!isValid || !data) {
      return;
    }

    setLoading(true);
    try {
      await signIn({
        email: data.email,
        password: data.password,
      });
    } catch (err: unknown) {
      setLoading(false);
      if (err instanceof ApiError) {
        if (err.code === 'INVALID_CREDENTIALS' || err.status === 401) {
          setGeneralError('Correo o contraseña incorrectos');
          return;
        }
        if (err.code === 'RATE_LIMITED' || err.status === 429) {
          setGeneralError('Demasiados intentos. Espera un momento e inténtalo de nuevo');
          return;
        }
        if (err.code === 'NETWORK_ERROR') {
          setGeneralError('Sin conexión con el servidor. Revisa tu red e inténtalo de nuevo');
          return;
        }
        setGeneralError(err.message || 'Ocurrió un error inesperado al iniciar sesión');
        return;
      }

      setGeneralError('Sin conexión con el servidor. Revisa tu red e inténtalo de nuevo');
    }
  };

  return (
    <ScreenContainer scroll contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Logo size={48} variant="full" />
        <AppText variant="title" style={styles.title}>
          Bienvenido
        </AppText>
        <AppText variant="caption" color="textMuted" style={styles.subtitle}>
          Inicia sesión para gestionar o consultar el estado de tu vehículo en tiempo real.
        </AppText>
      </View>

      {generalError && (
        <View
          style={[
            styles.alertBox,
            { backgroundColor: colors.surfaceAlt, borderColor: colors.danger },
          ]}
          accessibilityRole="alert"
        >
          <AppText variant="caption" color="danger" style={styles.alertText}>
            {generalError}
          </AppText>
        </View>
      )}

      <View style={styles.form}>
        <TextField
          label="Correo electrónico"
          placeholder="ejemplo@autoclean.com"
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
          label="Contraseña"
          placeholder="Ingresa tu contraseña"
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
          title="Iniciar sesión"
          variant="primary"
          size="lg"
          loading={loading}
          onPress={handleSubmit}
          style={styles.submitButton}
        />
      </View>

      <View style={styles.footer}>
        <AppText variant="body" color="textMuted">
          ¿No tienes cuenta?{' '}
        </AppText>
        <Link href="/(auth)/register" asChild>
          <Pressable hitSlop={8} accessibilityRole="link">
            <AppText variant="body" color="primary" style={styles.linkText}>
              Regístrate
            </AppText>
          </Pressable>
        </Link>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    paddingHorizontal: spacing[20],
    paddingVertical: spacing[32],
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
  alertBox: {
    borderWidth: 1,
    borderRadius: radius[8],
    padding: spacing[12],
    marginBottom: spacing[16],
  },
  alertText: {
    textAlign: 'center',
    lineHeight: 18,
  },
  form: {
    width: '100%',
    marginBottom: spacing[20],
  },
  submitButton: {
    marginTop: spacing[8],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing[12],
  },
  linkText: {
    fontWeight: '600',
  },
});
