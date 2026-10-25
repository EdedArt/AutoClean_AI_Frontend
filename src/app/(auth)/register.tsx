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
import { registerSchema } from '@/lib/validation';
import { radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme';

export default function RegisterScreen() {
  const { colors } = useTheme();
  const { signUp } = useAuth();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<{
    nombre?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const validate = (
    currentNombre: string,
    currentEmail: string,
    currentPassword: string,
    currentConfirmPassword: string,
  ): {
    isValid: boolean;
    errors: {
      nombre?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    };
    data: {
      nombre: string;
      email: string;
      password: string;
      confirmPassword: string;
    } | null;
  } => {
    const result = registerSchema.safeParse({
      nombre: currentNombre.trim(),
      email: currentEmail.trim(),
      password: currentPassword,
      confirmPassword: currentConfirmPassword,
    });

    if (!result.success) {
      const errors: {
        nombre?: string;
        email?: string;
        password?: string;
        confirmPassword?: string;
      } = {};
      for (const issue of result.error.issues) {
        const fieldName = issue.path[0] as
          | 'nombre'
          | 'email'
          | 'password'
          | 'confirmPassword';
        if (fieldName && !errors[fieldName]) {
          errors[fieldName] = issue.message;
        }
      }
      return { isValid: false, errors, data: null };
    }

    return { isValid: true, errors: {}, data: result.data };
  };

  const handleNombreChange = (text: string) => {
    setNombre(text);
    if (submitted) {
      const { errors } = validate(text, email, password, confirmPassword);
      setFieldErrors((prev) => ({ ...prev, nombre: errors.nombre }));
    }
  };

  const handleNombreBlur = () => {
    if (submitted || nombre.length > 0) {
      const { errors } = validate(nombre, email, password, confirmPassword);
      setFieldErrors((prev) => ({ ...prev, nombre: errors.nombre }));
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (submitted) {
      const { errors } = validate(nombre, text, password, confirmPassword);
      setFieldErrors((prev) => ({ ...prev, email: errors.email }));
    }
  };

  const handleEmailBlur = () => {
    if (submitted || email.length > 0) {
      const { errors } = validate(nombre, email, password, confirmPassword);
      setFieldErrors((prev) => ({ ...prev, email: errors.email }));
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (submitted) {
      const { errors } = validate(nombre, email, text, confirmPassword);
      setFieldErrors((prev) => ({
        ...prev,
        password: errors.password,
        confirmPassword: errors.confirmPassword,
      }));
    }
  };

  const handlePasswordBlur = () => {
    if (submitted || password.length > 0) {
      const { errors } = validate(nombre, email, password, confirmPassword);
      setFieldErrors((prev) => ({
        ...prev,
        password: errors.password,
        confirmPassword: errors.confirmPassword,
      }));
    }
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    if (submitted) {
      const { errors } = validate(nombre, email, password, text);
      setFieldErrors((prev) => ({ ...prev, confirmPassword: errors.confirmPassword }));
    }
  };

  const handleConfirmPasswordBlur = () => {
    if (submitted || confirmPassword.length > 0) {
      const { errors } = validate(nombre, email, password, confirmPassword);
      setFieldErrors((prev) => ({ ...prev, confirmPassword: errors.confirmPassword }));
    }
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    setGeneralError(null);

    const { isValid, errors, data } = validate(nombre, email, password, confirmPassword);
    setFieldErrors(errors);

    if (!isValid || !data) {
      return;
    }

    setLoading(true);
    try {
      await signUp({
        nombre: data.nombre,
        email: data.email,
        password: data.password,
      });
    } catch (err: unknown) {
      setLoading(false);
      if (err instanceof ApiError) {
        if (err.code === 'DUPLICATE_RESOURCE' || err.status === 409) {
          setFieldErrors((prev) => ({
            ...prev,
            email: 'Este correo ya está registrado',
          }));
          return;
        }

        if (err.code === 'VALIDATION_ERROR' && Array.isArray(err.details)) {
          const newErrors: { [key: string]: string } = {};
          let hasMapped = false;
          for (const item of err.details as Array<{ field?: string; message?: string }>) {
            if (item.field && item.message) {
              newErrors[item.field] = item.message;
              hasMapped = true;
            }
          }
          if (hasMapped) {
            setFieldErrors((prev) => ({ ...prev, ...newErrors }));
            return;
          }
        }

        if (err.code === 'RATE_LIMITED' || err.status === 429) {
          setGeneralError('Demasiados intentos. Espera un momento e inténtalo de nuevo');
          return;
        }

        if (err.code === 'NETWORK_ERROR') {
          setGeneralError('Sin conexión con el servidor. Revisa tu red e inténtalo de nuevo');
          return;
        }

        setGeneralError(err.message || 'Ocurrió un error al crear la cuenta');
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
          Crear cuenta
        </AppText>
        <AppText variant="caption" color="textMuted" style={styles.subtitle}>
          Regístrate para monitorear el estado y las fases de lavado de tu vehículo.
        </AppText>
        <View style={[styles.infoBanner, { backgroundColor: colors.surfaceAlt }]}>
          <AppText variant="caption" color="textMuted" style={styles.infoText}>
            Las cuentas registradas aquí corresponden al perfil de cliente.
          </AppText>
        </View>
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
          label="Nombre completo"
          placeholder="Ej. Carlos Gómez"
          value={nombre}
          onChangeText={handleNombreChange}
          onBlur={handleNombreBlur}
          errorText={fieldErrors.nombre}
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={60}
          showCounter
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
        />

        <TextField
          ref={emailRef}
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
          placeholder="Entre 8 y 12 caracteres"
          helperText="Entre 8 y 12 caracteres"
          value={password}
          onChangeText={handlePasswordChange}
          onBlur={handlePasswordBlur}
          errorText={fieldErrors.password}
          secureTextEntry={!showPassword}
          maxLength={12}
          rightIcon={showPassword ? 'EyeOff' : 'Eye'}
          onRightIconPress={() => setShowPassword((prev) => !prev)}
          returnKeyType="next"
          onSubmitEditing={() => confirmPasswordRef.current?.focus()}
        />

        <TextField
          ref={confirmPasswordRef}
          label="Confirmar contraseña"
          placeholder="Repite tu contraseña"
          value={confirmPassword}
          onChangeText={handleConfirmPasswordChange}
          onBlur={handleConfirmPasswordBlur}
          errorText={fieldErrors.confirmPassword}
          secureTextEntry={!showConfirmPassword}
          maxLength={12}
          rightIcon={showConfirmPassword ? 'EyeOff' : 'Eye'}
          onRightIconPress={() => setShowConfirmPassword((prev) => !prev)}
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />

        <Button
          title="Crear cuenta"
          variant="primary"
          size="lg"
          loading={loading}
          onPress={handleSubmit}
          style={styles.submitButton}
        />
      </View>

      <View style={styles.footer}>
        <AppText variant="body" color="textMuted">
          ¿Ya tienes cuenta?{' '}
        </AppText>
        <Link href="/(auth)/login" asChild>
          <Pressable hitSlop={8} accessibilityRole="link">
            <AppText variant="body" color="primary" style={styles.linkText}>
              Inicia sesión
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
    marginBottom: spacing[20],
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
  infoBanner: {
    marginTop: spacing[12],
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[8],
    borderRadius: radius[8],
    maxWidth: 340,
  },
  infoText: {
    textAlign: 'center',
    fontSize: 12,
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
