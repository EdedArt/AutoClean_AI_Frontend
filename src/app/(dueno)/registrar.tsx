import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, StyleSheet, View } from 'react-native';
import { type Href, router, useIsFocused } from 'expo-router';

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
import { formatPlateInput, INVALID_PLATE_MESSAGE, isValidPlate } from '@/lib/plate';
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
      nextErrors.placa = INVALID_PLATE_MESSAGE;
    }

    const trimmedOwner = ownerName.trim();
    if (trimmedOwner.length < 2) {
      nextErrors.ownerName = 'El nombre del dueño debe tener al menos 2 caracteres.';
    } else if (trimmedOwner.length > 60) {
      nextErrors.ownerName = 'El nombre del dueño no puede superar 60 caracteres.';
    }

    if (!marca.trim()) {
      nextErrors.marca = 'Ingresa la marca del vehículo.';
    }

    if (!modelo.trim()) {
      nextErrors.modelo = 'Ingresa el modelo del vehículo.';
    }

    const trimmedColor = color.trim();
    if (!trimmedColor) {
      nextErrors.color = 'Ingresa el color del vehículo.';
    } else if (trimmedColor.length > 30) {
      nextErrors.color = 'El color no puede superar 30 caracteres.';
    }

    const trimmedEmail = ownerEmail.trim();
    if (trimmedEmail.length > 0) {
      if (trimmedEmail.length > 100) {
        nextErrors.ownerEmail = 'El correo no puede superar 100 caracteres.';
      } else if (!EMAIL_REGEX.test(trimmedEmail)) {
        nextErrors.ownerEmail = 'Ingresa un correo electrónico válido.';
      }
    }

    if (!packageId) {
      nextErrors.packageId = 'Selecciona un paquete de lavado.';
    }

    if (!bayId) {
      nextErrors.bayId = 'Selecciona una bahía libre.';
    } else {
      const selectedBay = bays?.find((b) => b.id === bayId);
      if (selectedBay?.ocupada) {
        nextErrors.bayId = 'La bahía seleccionada está ocupada. Elige otra.';
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
              title: 'Vehículo creado, pero la orden quedó pendiente',
              message: err.message,
            });
            return;
          }

          if (err instanceof ApiError) {
            if (err.code === 'ACTIVE_ORDER_EXISTS') {
              const details = err.details as { orderId?: number } | undefined;
              setSubmitBanner({
                type: 'warning',
                title: 'Orden activa existente',
                message: `El vehículo con placa ${formattedPlaca} ya tiene una orden de lavado activa en curso.`,
                activeOrderId: details?.orderId,
              });
              return;
            }

            if (err.code === 'BAY_OCCUPIED') {
              setErrors((prev) => ({
                ...prev,
                bayId: 'Esta bahía acaba de ser ocupada. Selecciona una bahía libre.',
              }));
              setSubmitBanner({
                type: 'error',
                title: 'Bahía ocupada',
                message: 'La bahía seleccionada ya está ocupada. Elige otra bahía libre.',
              });
              return;
            }

            if (err.code === 'OWNER_NOT_FOUND') {
              setErrors((prev) => ({
                ...prev,
                ownerEmail:
                  'No existe una cuenta de cliente registrada con este correo. Déjalo vacío o corrígelo.',
              }));
              return;
            }

            if (err.code === 'INVALID_OWNER') {
              setErrors((prev) => ({
                ...prev,
                ownerEmail: 'El correo ingresado no corresponde a una cuenta de cliente.',
              }));
              return;
            }

            if (err.code === 'NETWORK_ERROR') {
              setSubmitBanner({
                type: 'error',
                title: 'Sin conexión con el servidor',
                message:
                  'Verifica tu conexión a internet o el estado del backend e inténtalo de nuevo.',
              });
              return;
            }

            setSubmitBanner({
              type: 'error',
              title: 'No se pudo completar el registro',
              message: err.message,
            });
            return;
          }

          setSubmitBanner({
            type: 'error',
            title: 'Error inesperado',
            message: 'No fue posible registrar el vehículo y la orden. Inténtalo de nuevo.',
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
          Registrar vehículo
        </AppText>
        <AppText variant="caption" muted>
          Ingresa los datos del vehículo y asigna paquete y bahía de lavado
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
                Orden registrada exitosamente
              </AppText>
              <AppText variant="caption" muted style={styles.feedbackMessage}>
                Placa {createdOrder.vehicle?.placa ?? ''} asignada a orden #{createdOrder.id}.
              </AppText>
            </View>
          </View>
          <View style={styles.feedbackActions}>
            <Button
              title="Ver detalle de la orden"
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
                title="Ir a la orden activa"
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
          label="Placa *"
          placeholder="ABC-123"
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
          label="Nombre del dueño *"
          placeholder="Ej. Carlos Gómez"
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
              label="Marca *"
              placeholder="Ej. Mazda"
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
              label="Modelo *"
              placeholder="Ej. CX-50"
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
          label="Color *"
          placeholder="Ej. Rojo"
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
          label="Correo del cliente (opcional)"
          placeholder="cliente@autoclean.com"
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
          helperText="Si el cliente tiene cuenta, vincula el vehículo con su correo"
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
              Cargando paquetes y bahías disponibles...
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
              No se pudieron cargar los paquetes o las bahías.
            </AppText>
            <Button
              title="Reintentar"
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
          title="Registrar vehículo y crear orden"
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
