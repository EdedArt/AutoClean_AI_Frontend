import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, StyleSheet, View } from 'react-native';
import { type Href, router, useIsFocused } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ApiError } from '@/api/client';
import { type ServiceOrder } from '@/api/orders';
import { type DirtLevel } from '@/api/vehicles';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { ScreenContainer } from '@/components/ScreenContainer';
import { TextField } from '@/components/TextField';
import { BaySelector, DirtLevelSelector, PackageSelector } from '@/features/dueno/FormSelectors';
import { useBays, usePackages } from '@/features/dueno/useCatalogs';
import {
  PartialRegistrationError,
  useRegisterVehicleAndOrder,
} from '@/features/dueno/useOrderMutations';
import { getApiErrorMessage } from '@/lib/i18nFormat';
import { formatPlateInput, isValidPlate } from '@/lib/plate';
import { useTheme } from '@/theme';
import { radius, spacing, withAlpha } from '@/theme/tokens';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormErrors {
  placa?: string;
  ownerName?: string;
  marca?: string;
  modelo?: string;
  color?: string;
  ownerEmail?: string;
  packageId?: string;
  bayId?: string;
}

export default function RegistrarScreen() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const isFocused = useIsFocused();

  const [placa, setPlaca] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [color, setColor] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [nivelSuciedad, setNivelSuciedad] = useState<DirtLevel | undefined>(undefined);
  const [packageId, setPackageId] = useState<number | null>(null);
  const [bayId, setBayId] = useState<number | null>(null);

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitBanner, setSubmitBanner] = useState<{
    type: 'error' | 'warning';
    title: string;
    message: string;
    activeOrderId?: number;
  } | null>(null);
  const [createdOrder, setCreatedOrder] = useState<ServiceOrder | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    data: packages,
    isPending: isPackagesPending,
    isError: isPackagesError,
    refetch: refetchPackages,
  } = usePackages();

  const {
    data: bays,
    isPending: isBaysPending,
    isError: isBaysError,
    refetch: refetchBays,
  } = useBays();

  const { mutate: registerVehicleAndOrder, isPending: isSubmitting } = useRegisterVehicleAndOrder();

  useEffect(() => {
    if (isFocused) {
      void refetchBays();
    }
  }, [isFocused, refetchBays]);

  const handleRefreshCatalogs = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchPackages(), refetchBays()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchPackages, refetchBays]);

  const resetForm = () => {
    setPlaca('');
    setOwnerName('');
    setMarca('');
    setModelo('');
    setColor('');
    setOwnerEmail('');
    setNivelSuciedad(undefined);
    setPackageId(null);
    setBayId(null);
    setErrors({});
  };

  const validateForm = (): boolean => {
    const nextErrors: FormErrors = {};
    const formattedPlaca = formatPlateInput(placa);

    if (!isValidPlate(formattedPlaca)) {
      nextErrors.placa = t('client.invalidPlate');
    }

    const trimmedOwner = ownerName.trim();
    if (trimmedOwner.length < 2) {
      nextErrors.ownerName = t('registerVehicle.errors.ownerNameMin');
    } else if (trimmedOwner.length > 60) {
      nextErrors.ownerName = t('registerVehicle.errors.ownerNameMax');
    }

    if (!marca.trim()) {
      nextErrors.marca = t('registerVehicle.errors.brandRequired');
    }

    if (!modelo.trim()) {
      nextErrors.modelo = t('registerVehicle.errors.modelRequired');
    }

    const trimmedColor = color.trim();
    if (!trimmedColor) {
      nextErrors.color = t('registerVehicle.errors.colorRequired');
    } else if (trimmedColor.length > 30) {
      nextErrors.color = t('registerVehicle.errors.colorMax');
    }

    const trimmedEmail = ownerEmail.trim();
    if (trimmedEmail.length > 0) {
      if (trimmedEmail.length > 100) {
        nextErrors.ownerEmail = t('registerVehicle.errors.emailMax');
      } else if (!EMAIL_REGEX.test(trimmedEmail)) {
        nextErrors.ownerEmail = t('registerVehicle.errors.emailInvalid');
      }
    }

    if (!packageId) {
      nextErrors.packageId = t('registerVehicle.errors.packageRequired');
    }

    if (!bayId) {
      nextErrors.bayId = t('registerVehicle.errors.bayRequired');
    } else {
      const selectedBay = bays?.find((b) => b.id === bayId);
      if (selectedBay?.ocupada) {
        nextErrors.bayId = t('registerVehicle.errors.bayOccupied');
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = () => {
    setSubmitBanner(null);
    setCreatedOrder(null);

    if (!validateForm() || !packageId || !bayId) {
      return;
    }

    const formattedPlaca = formatPlateInput(placa);

    registerVehicleAndOrder(
      {
        placa: formattedPlaca,
        ownerName: ownerName.trim(),
        marca: marca.trim(),
        modelo: modelo.trim(),
        color: color.trim(),
        ownerEmail: ownerEmail.trim() || undefined,
        nivelSuciedad,
        packageId,
        bayId,
      },
      {
        onSuccess: ({ order }) => {
          resetForm();
          setCreatedOrder(order);
          void refetchBays();
        },
        onError: (err) => {
          void refetchBays();

          if (err instanceof PartialRegistrationError) {
            setSubmitBanner({
              type: 'warning',
              title: t('registerVehicle.errors.partialTitle'),
              message: err.message,
            });
            return;
          }

          if (err instanceof ApiError) {
            if (err.code === 'ACTIVE_ORDER_EXISTS') {
              const details = err.details as { orderId?: number } | undefined;
              setSubmitBanner({
                type: 'warning',
                title: t('registerVehicle.errors.activeOrderTitle'),
                message: t('registerVehicle.errors.activeOrderMessage', { placa: formattedPlaca }),
                activeOrderId: details?.orderId,
              });
              return;
            }

            if (err.code === 'BAY_OCCUPIED') {
              setErrors((prev) => ({
                ...prev,
                bayId: t('registerVehicle.errors.bayJustTaken'),
              }));
              setSubmitBanner({
                type: 'error',
                title: t('registerVehicle.errors.bayOccupiedTitle'),
                message: t('registerVehicle.errors.bayOccupiedMessage'),
              });
              return;
            }

            if (err.code === 'OWNER_NOT_FOUND') {
              setErrors((prev) => ({
                ...prev,
                ownerEmail: t('registerVehicle.errors.ownerNotFound'),
              }));
              return;
            }

            if (err.code === 'INVALID_OWNER') {
              setErrors((prev) => ({
                ...prev,
                ownerEmail: t('registerVehicle.errors.invalidOwner'),
              }));
              return;
            }

            if (err.code === 'NETWORK_ERROR') {
              setSubmitBanner({
                type: 'error',
                title: t('common.noConnectionTitle'),
                message: t('common.noConnectionSubtitle'),
              });
              return;
            }

            setSubmitBanner({
              type: 'error',
              title: t('registerVehicle.errors.registerFailedTitle'),
              message: getApiErrorMessage(t, err, 'registerVehicle.errors.registerFailedMessage'),
            });
            return;
          }

          setSubmitBanner({
            type: 'error',
            title: t('registerVehicle.errors.unexpectedTitle'),
            message: t('registerVehicle.errors.registerFailedMessage'),
          });
        },
      },
    );
  };

  const catalogsLoading = (isPackagesPending && !packages) || (isBaysPending && !bays);
  const catalogsError = (isPackagesError && !packages) || (isBaysError && !bays);

  return (
    <ScreenContainer
      scroll
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefreshCatalogs}
          tintColor={colors.primary}
          colors={[colors.primary]}
          progressBackgroundColor={colors.surface}
        />
      }
    >
      <View style={styles.header}>
        <AppText variant="title" weight="bold" style={styles.title}>
          {t('registerVehicle.title')}
        </AppText>
        <AppText variant="caption" muted>
          {t('registerVehicle.subtitle')}
        </AppText>
      </View>

      {/* Success Confirmation Banner */}
      {createdOrder ? (
        <Card
          variant="elevated"
          style={[
            styles.feedbackCard,
            {
              borderColor: withAlpha(colors.accent, isDark ? 0.45 : 0.35),
              backgroundColor: withAlpha(colors.accent, isDark ? 0.1 : 0.05),
              borderWidth: 1,
            },
          ]}
          accessible
          accessibilityRole="alert"
        >
          <View style={styles.feedbackHeader}>
            <View
              style={[
                styles.feedbackIconCircle,
                { backgroundColor: withAlpha(colors.accent, isDark ? 0.22 : 0.14) },
              ]}
            >
              <Icon name="CircleCheck" size={20} color={colors.accent} />
            </View>
            <View style={styles.feedbackTextCol}>
              <AppText variant="subtitle" weight="semiBold">
                {t('registerVehicle.orderCreatedTitle')}
              </AppText>
              <AppText variant="caption" muted style={styles.feedbackMessage}>
                {t('registerVehicle.orderCreatedMessage', {
                  placa: createdOrder.vehicle?.placa ?? '',
                  id: createdOrder.id,
                })}
              </AppText>
            </View>
          </View>
          <View style={styles.feedbackActions}>
            <Button
              title={t('registerVehicle.viewOrderDetail')}
              size="sm"
              rightIcon="ChevronRight"
              onPress={() => {
                const targetId = createdOrder.id;
                setCreatedOrder(null);
                router.push(`/orden/${targetId}` as Href);
              }}
            />
          </View>
        </Card>
      ) : null}

      {/* Error / Warning Banner */}
      {submitBanner ? (
        <Card
          variant="outlined"
          style={[
            styles.feedbackCard,
            {
              borderColor: withAlpha(
                submitBanner.type === 'warning' ? colors.warning : colors.danger,
                isDark ? 0.45 : 0.35,
              ),
              backgroundColor: withAlpha(
                submitBanner.type === 'warning' ? colors.warning : colors.danger,
                isDark ? 0.12 : 0.06,
              ),
            },
          ]}
          accessible
          accessibilityRole="alert"
        >
          <View style={styles.feedbackHeader}>
            <View
              style={[
                styles.feedbackIconCircle,
                {
                  backgroundColor: withAlpha(
                    submitBanner.type === 'warning' ? colors.warning : colors.danger,
                    isDark ? 0.22 : 0.14,
                  ),
                },
              ]}
            >
              <Icon
                name="AlertCircle"
                size={20}
                color={submitBanner.type === 'warning' ? colors.warning : colors.danger}
              />
            </View>
            <View style={styles.feedbackTextCol}>
              <AppText variant="body" weight="semiBold">
                {submitBanner.title}
              </AppText>
              <AppText variant="caption" muted style={styles.feedbackMessage}>
                {submitBanner.message}
              </AppText>
            </View>
          </View>
          {submitBanner.activeOrderId ? (
            <View style={styles.feedbackActions}>
              <Button
                title={t('registerVehicle.goToActiveOrder')}
                variant="secondary"
                size="sm"
                rightIcon="ChevronRight"
                onPress={() => {
                  const id = submitBanner.activeOrderId;
                  setSubmitBanner(null);
                  if (id) {
                    router.push(`/orden/${id}` as Href);
                  }
                }}
              />
            </View>
          ) : null}
        </Card>
      ) : null}

      {/* Form Card */}
      <Card variant="elevated" style={styles.formCard}>
        <TextField
          label={`${t('registerVehicle.plate')} *`}
          placeholder={t('client.platePlaceholder')}
          value={placa}
          onChangeText={(raw) => {
            setPlaca(formatPlateInput(raw));
            if (errors.placa) {
              setErrors((prev) => ({ ...prev, placa: undefined }));
            }
          }}
          maxLength={7}
          autoCapitalize="characters"
          autoCorrect={false}
          editable={!isSubmitting}
          errorText={errors.placa}
        />

        <TextField
          label={`${t('registerVehicle.ownerName')} *`}
          placeholder={t('registerVehicle.ownerNamePlaceholder')}
          value={ownerName}
          onChangeText={(val) => {
            setOwnerName(val);
            if (errors.ownerName) {
              setErrors((prev) => ({ ...prev, ownerName: undefined }));
            }
          }}
          maxLength={60}
          showCounter
          autoCapitalize="words"
          editable={!isSubmitting}
          errorText={errors.ownerName}
        />

        <View style={styles.twoColRow}>
          <View style={styles.colItem}>
            <TextField
              label={`${t('registerVehicle.brand')} *`}
              placeholder={t('registerVehicle.brandPlaceholder')}
              value={marca}
              onChangeText={(val) => {
                setMarca(val);
                if (errors.marca) {
                  setErrors((prev) => ({ ...prev, marca: undefined }));
                }
              }}
              maxLength={40}
              autoCapitalize="words"
              editable={!isSubmitting}
              errorText={errors.marca}
            />
          </View>

          <View style={styles.colItem}>
            <TextField
              label={`${t('registerVehicle.model')} *`}
              placeholder={t('registerVehicle.modelPlaceholder')}
              value={modelo}
              onChangeText={(val) => {
                setModelo(val);
                if (errors.modelo) {
                  setErrors((prev) => ({ ...prev, modelo: undefined }));
                }
              }}
              maxLength={40}
              editable={!isSubmitting}
              errorText={errors.modelo}
            />
          </View>
        </View>

        <TextField
          label={`${t('registerVehicle.color')} *`}
          placeholder={t('registerVehicle.colorPlaceholder')}
          value={color}
          onChangeText={(val) => {
            setColor(val);
            if (errors.color) {
              setErrors((prev) => ({ ...prev, color: undefined }));
            }
          }}
          maxLength={30}
          showCounter
          autoCapitalize="words"
          editable={!isSubmitting}
          errorText={errors.color}
        />

        <TextField
          label={`${t('registerVehicle.clientEmail')} (${t('common.optional')})`}
          placeholder={t('registerVehicle.clientEmailPlaceholder')}
          value={ownerEmail}
          onChangeText={(val) => {
            setOwnerEmail(val);
            if (errors.ownerEmail) {
              setErrors((prev) => ({ ...prev, ownerEmail: undefined }));
            }
          }}
          maxLength={100}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isSubmitting}
          helperText={t('registerVehicle.clientEmailHint')}
          errorText={errors.ownerEmail}
        />

        <DirtLevelSelector
          selected={nivelSuciedad}
          onSelect={setNivelSuciedad}
          disabled={isSubmitting}
        />

        <View style={[styles.sectionDivider, { backgroundColor: colors.border }]} />

        {catalogsLoading ? (
          <View style={styles.catalogsLoadingBlock}>
            <ActivityIndicator size="small" color={colors.primary} />
            <AppText variant="caption" muted style={styles.catalogsLoadingText}>
              {t('registerVehicle.loadingCatalogs')}
            </AppText>
          </View>
        ) : catalogsError ? (
          <View
            style={[
              styles.catalogsErrorBlock,
              {
                backgroundColor: withAlpha(colors.danger, isDark ? 0.14 : 0.08),
                borderColor: withAlpha(colors.danger, isDark ? 0.4 : 0.28),
              },
            ]}
          >
            <AppText variant="caption" color="danger" style={styles.catalogsErrorText}>
              {t('registerVehicle.errorCatalogs')}
            </AppText>
            <Button
              title={t('common.retry')}
              variant="secondary"
              size="sm"
              leftIcon="RefreshCw"
              onPress={() => {
                void handleRefreshCatalogs();
              }}
            />
          </View>
        ) : (
          <>
            <PackageSelector
              packages={packages ?? []}
              selectedId={packageId}
              onSelect={(id) => {
                setPackageId(id);
                if (errors.packageId) {
                  setErrors((prev) => ({ ...prev, packageId: undefined }));
                }
              }}
              errorText={errors.packageId}
              disabled={isSubmitting}
            />

            <BaySelector
              bays={bays ?? []}
              selectedId={bayId}
              onSelect={(id) => {
                setBayId(id);
                if (errors.bayId) {
                  setErrors((prev) => ({ ...prev, bayId: undefined }));
                }
              }}
              errorText={errors.bayId}
              disabled={isSubmitting}
            />
          </>
        )}

        <Button
          title={t('registerVehicle.submitButton')}
          size="lg"
          leftIcon="Plus"
          fullWidth
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitting || catalogsLoading}
          style={styles.submitButton}
        />
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing[12],
    paddingBottom: spacing[32],
  },
  header: {
    marginBottom: spacing[16],
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    marginBottom: 4,
  },
  feedbackCard: {
    marginBottom: spacing[16],
    padding: spacing[16],
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  feedbackIconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[12],
  },
  feedbackTextCol: {
    flex: 1,
  },
  feedbackMessage: {
    marginTop: 4,
  },
  feedbackActions: {
    marginTop: spacing[12],
    alignSelf: 'flex-start',
  },
  formCard: {
    padding: spacing[16],
  },
  twoColRow: {
    flexDirection: 'row',
    gap: spacing[12],
  },
  colItem: {
    flex: 1,
  },
  sectionDivider: {
    height: 1,
    marginBottom: spacing[16],
  },
  catalogsLoadingBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[16],
    marginBottom: spacing[16],
  },
  catalogsLoadingText: {
    marginLeft: spacing[8],
  },
  catalogsErrorBlock: {
    padding: spacing[12],
    borderRadius: radius[12],
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: spacing[16],
  },
  catalogsErrorText: {
    textAlign: 'center',
    marginBottom: spacing[8],
  },
  submitButton: {
    marginTop: spacing[8],
  },
});
