import React, { useEffect, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ThemeToggle } from '@/components/ThemeToggle';
import { getRoleLabel, useAuth } from '@/features/auth';
import { radius, spacing, withAlpha } from '@/theme/tokens';
import { useTheme } from '@/theme';

const AVATAR_STORAGE_PREFIX = 'autoclean.avatar';

function getAvatarStorageKey(userId?: number | string | null): string {
  if (userId !== undefined && userId !== null && String(userId).trim() !== '') {
    return `${AVATAR_STORAGE_PREFIX}.${String(userId).trim()}`;
  }
  return AVATAR_STORAGE_PREFIX;
}

function getUserInitials(nombre?: string | null): string {
  if (!nombre) {
    return 'AC';
  }
  const parts = nombre
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 0);

  if (parts.length === 0) {
    return 'AC';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function ProfileView() {
  const { colors, isDark } = useTheme();
  const { user, signOut } = useAuth();
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const storageKey = getAvatarStorageKey(user?.id);
  const initials = getUserInitials(user?.nombre);
  const roleLabel = getRoleLabel(user?.role);
  const isDueno = user?.role === 'OPERARIO';

  useEffect(() => {
    let isMounted = true;

    AsyncStorage.getItem(storageKey)
      .then((savedUri) => {
        if (isMounted) {
          setAvatarUri(savedUri && savedUri.trim().length > 0 ? savedUri : null);
        }
      })
      .catch(() => {
        if (isMounted) {
          setAvatarUri(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [storageKey]);

  const handlePickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permiso requerido',
          'Necesitamos acceso a tu galería de fotos para elegir una imagen de perfil. Puedes habilitar el permiso en los ajustes de tu teléfono.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.4,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        setAvatarUri(selectedUri);
        try {
          await AsyncStorage.setItem(storageKey, selectedUri);
        } catch {
          // Ignore local storage write failure
        }
      }
    } catch {
      Alert.alert('Error', 'No se pudo abrir la galería de fotos del dispositivo.');
    }
  };

  const handleRemovePhoto = async () => {
    setAvatarUri(null);
    try {
      await AsyncStorage.removeItem(storageKey);
    } catch {
      // Ignore local storage removal failure
    }
  };

  const handleAvatarPress = () => {
    if (!avatarUri) {
      void handlePickFromGallery();
      return;
    }

    Alert.alert('Foto de perfil', '¿Qué deseas hacer con tu foto de perfil?', [
      {
        text: 'Cambiar foto de galería',
        onPress: () => {
          void handlePickFromGallery();
        },
      },
      {
        text: 'Quitar foto actual',
        style: 'destructive',
        onPress: () => {
          void handleRemovePhoto();
        },
      },
      {
        text: 'Cancelar',
        style: 'cancel',
      },
    ]);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <ScreenContainer scroll contentContainerStyle={styles.container}>
      <Card variant="elevated" style={styles.profileCard}>
        <Pressable
          onPress={handleAvatarPress}
          accessible
          accessibilityRole="button"
          accessibilityLabel={
            avatarUri
              ? 'Foto de perfil. Toca para cambiar o quitar tu foto'
              : `Avatar con iniciales ${initials}. Toca para elegir una foto de perfil de tu galería`
          }
          style={({ pressed }) => [styles.avatarPressable, { opacity: pressed ? 0.85 : 1 }]}
        >
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: withAlpha(colors.primary, isDark ? 0.2 : 0.12),
                borderColor: withAlpha(colors.primary, isDark ? 0.45 : 0.3),
              },
            ]}
          >
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={styles.avatarImage}
                onError={() => {
                  void handleRemovePhoto();
                }}
              />
            ) : (
              <AppText
                variant="title"
                weight="bold"
                style={[styles.initialsText, { color: colors.primary }]}
              >
                {initials}
              </AppText>
            )}
          </View>

          <View
            style={[
              styles.cameraBadge,
              {
                backgroundColor: colors.primary,
                borderColor: colors.surface,
              },
            ]}
          >
            <Icon name="Camera" size={14} color={colors.onPrimary} />
          </View>
        </Pressable>

        <View style={styles.photoActionsRow}>
          <Pressable
            onPress={() => {
              void handlePickFromGallery();
            }}
            accessible
            accessibilityRole="button"
            accessibilityLabel={
              avatarUri ? 'Cambiar foto de perfil' : 'Elegir foto de perfil desde galería'
            }
            style={({ pressed }) => [
              styles.photoActionPill,
              {
                backgroundColor: colors.surfaceAlt,
                borderColor: colors.border,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <Icon name="Camera" size={14} color={colors.primary} />
            <AppText variant="caption" weight="semiBold" style={{ color: colors.primary }}>
              {avatarUri ? 'Cambiar foto' : 'Elegir foto'}
            </AppText>
          </Pressable>

          {avatarUri ? (
            <Pressable
              onPress={() => {
                void handleRemovePhoto();
              }}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Quitar foto de perfil"
              style={({ pressed }) => [
                styles.photoActionPill,
                {
                  backgroundColor: withAlpha(colors.danger, isDark ? 0.14 : 0.08),
                  borderColor: withAlpha(colors.danger, isDark ? 0.35 : 0.25),
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <Icon name="Trash2" size={14} color={colors.danger} />
              <AppText variant="caption" weight="semiBold" style={{ color: colors.danger }}>
                Quitar foto
              </AppText>
            </Pressable>
          ) : null}
        </View>

        <AppText variant="title" weight="bold" style={styles.nameText}>
          {user?.nombre || 'Usuario'}
        </AppText>
        <AppText variant="caption" muted style={styles.emailText}>
          {user?.email || ''}
        </AppText>
        <View style={styles.badgeRow}>
          <Badge
            label={roleLabel}
            variant={isDueno ? 'accent' : 'primary'}
            icon={isDueno ? 'LayoutDashboard' : 'User'}
            size="md"
          />
        </View>
      </Card>

      <Card variant="elevated" style={styles.sectionCard}>
        <AppText variant="subtitle" weight="semiBold" style={styles.sectionTitle}>
          Apariencia
        </AppText>
        <View style={styles.themeRow}>
          <AppText variant="body" muted>
            Tema de la aplicación
          </AppText>
          <ThemeToggle showLabel={false} />
        </View>
      </Card>

      {__DEV__ && (
        <Card variant="outlined" style={styles.sectionCard}>
          <AppText variant="subtitle" weight="semiBold" style={styles.sectionTitle}>
            Entorno de desarrollo
          </AppText>
          <Button
            title="Ver Guía de Estilos"
            variant="secondary"
            size="md"
            leftIcon="Sparkles"
            fullWidth
            onPress={() => router.push('/style-guide')}
          />
        </Card>
      )}

      <View style={styles.actionsContainer}>
        <Button
          title="Cerrar sesión"
          variant="destructive"
          size="lg"
          leftIcon="LogOut"
          fullWidth
          onPress={handleSignOut}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing[16],
    paddingBottom: spacing[32],
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: spacing[24],
    paddingHorizontal: spacing[16],
    marginBottom: spacing[16],
  },
  avatarPressable: {
    position: 'relative',
    marginBottom: spacing[12],
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  initialsText: {
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: 0.8,
  },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: spacing[8],
    marginBottom: spacing[12],
  },
  photoActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[8],
    borderRadius: radius.pill,
    borderWidth: 1,
    gap: 6,
  },
  nameText: {
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  emailText: {
    textAlign: 'center',
    marginBottom: spacing[8],
  },
  badgeRow: {
    marginTop: spacing[4],
  },
  sectionCard: {
    marginBottom: spacing[16],
  },
  sectionTitle: {
    marginBottom: spacing[12],
  },
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[4],
  },
  actionsContainer: {
    marginTop: spacing[8],
  },
});
