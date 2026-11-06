import React, { useEffect, useState } from 'react';
import { Alert, Image, LayoutAnimation, Pressable, StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/features/auth';
import { LANGUAGE_STORAGE_KEY, type SupportedLanguage } from '@/i18n';
import { radius, spacing, withAlpha } from '@/theme/tokens';
import { useTheme } from '@/theme';
import { deleteAvatarFiles, persistAvatarFile, resolveOrMigrateAvatarUri } from './avatarStorage';

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
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useTheme();
  const { user, signOut } = useAuth();
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const storageKey = getAvatarStorageKey(user?.id);
  const initials = getUserInitials(user?.nombre);
  const isDueno = user?.role === 'OPERARIO';
  const roleLabel = isDueno ? t('profile.owner') : t('profile.client');
  const currentLang: SupportedLanguage = i18n.language?.startsWith('en') ? 'en' : 'es';

  const handleSelectLanguage = async (lang: SupportedLanguage) => {
    if (lang === currentLang) {
      return;
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    await i18n.changeLanguage(lang);
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // Ignore local storage write failure
    }
  };

  useEffect(() => {
    let isMounted = true;

    AsyncStorage.getItem(storageKey)
      .then(async (savedUri) => {
        if (!isMounted) {
          return;
        }
        if (!savedUri || savedUri.trim().length === 0) {
          setAvatarUri(null);
          return;
        }

        const resolved = await resolveOrMigrateAvatarUri(user?.id, savedUri, storageKey);
        if (isMounted) {
          setAvatarUri(resolved);
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
  }, [storageKey, user?.id]);

  const handlePickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t('profile.permissionRequiredTitle'), t('profile.permissionRequiredMsg'));
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
        try {
          const persistentUri = await persistAvatarFile(user?.id, selectedUri, avatarUri);
          if (persistentUri) {
            setAvatarUri(persistentUri);
            try {
              await AsyncStorage.setItem(storageKey, persistentUri);
            } catch {
              // Ignore local storage write failure
            }
          } else {
            Alert.alert(t('common.error'), t('profile.savePhotoError'));
          }
        } catch {
          Alert.alert(t('common.error'), t('profile.savePhotoError'));
        }
      }
    } catch {
      Alert.alert(t('common.error'), t('profile.openGalleryError'));
    }
  };

  const handleRemovePhoto = async () => {
    const currentUri = avatarUri;
    setAvatarUri(null);
    await deleteAvatarFiles(user?.id, currentUri);
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

    Alert.alert(t('profile.photoDialogTitle'), t('profile.photoDialogMessage'), [
      {
        text: t('profile.changeFromGallery'),
        onPress: () => {
          void handlePickFromGallery();
        },
      },
      {
        text: t('profile.removeCurrentPhoto'),
        style: 'destructive',
        onPress: () => {
          void handleRemovePhoto();
        },
      },
      {
        text: t('common.cancel'),
        style: 'cancel',
      },
    ]);
  };

  const handleSignOut = () => {
    Alert.alert(
      t('profile.logout'),
      t('profile.logoutConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.logout'),
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
              ? `${t('profile.photoDialogTitle')}: ${t('profile.changePhoto')}`
              : `${initials}: ${t('profile.choosePhoto')}`
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
            accessibilityLabel={avatarUri ? t('profile.changePhoto') : t('profile.choosePhoto')}
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
              {avatarUri ? t('profile.changePhoto') : t('profile.choosePhoto')}
            </AppText>
          </Pressable>

          {avatarUri ? (
            <Pressable
              onPress={() => {
                void handleRemovePhoto();
              }}
              accessible
              accessibilityRole="button"
              accessibilityLabel={t('profile.removePhoto')}
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
                {t('profile.removePhoto')}
              </AppText>
            </Pressable>
          ) : null}
        </View>

        <AppText variant="title" weight="bold" style={styles.nameText}>
          {user?.nombre || t('profile.defaultUser')}
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
          {t('profile.appearance')}
        </AppText>
        <View style={styles.themeRow}>
          <AppText variant="body" muted>
            {t('profile.appTheme')}
          </AppText>
          <ThemeToggle showLabel={false} />
        </View>
      </Card>

      <Card variant="elevated" style={styles.sectionCard}>
        <View style={styles.themeRow}>
          <AppText variant="subtitle" weight="semiBold">
            {t('profile.language')}
          </AppText>
          <View
            style={[
              styles.segmentedControl,
              {
                backgroundColor: colors.surfaceAlt,
                borderColor: colors.border,
              },
            ]}
            accessibilityRole="radiogroup"
          >
            {(
              [
                { code: 'es' as const, label: 'ES', ariaLabel: t('profile.spanish') },
                { code: 'en' as const, label: 'EN', ariaLabel: t('profile.english') },
              ] as const
            ).map((option) => {
              const isSelected = currentLang === option.code;
              return (
                <Pressable
                  key={option.code}
                  onPress={() => {
                    void handleSelectLanguage(option.code);
                  }}
                  accessible
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={option.ariaLabel}
                  style={({ pressed }) => [
                    styles.segmentButton,
                    {
                      backgroundColor: isSelected ? colors.primary : 'transparent',
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <AppText
                    variant="caption"
                    weight="semiBold"
                    style={[
                      styles.segmentText,
                      { color: isSelected ? '#FFFFFF' : colors.textMuted },
                    ]}
                  >
                    {option.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Card>

      <View style={styles.actionsContainer}>
        <Button
          title={t('profile.logout')}
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
  segmentedControl: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 96,
    padding: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  segmentButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  segmentText: {
    fontSize: 13,
    lineHeight: 16,
  },
  actionsContainer: {
    marginTop: spacing[8],
  },
});
