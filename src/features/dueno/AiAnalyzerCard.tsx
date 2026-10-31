import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { useAnalyzeOrderImage } from './useOrderMutations';
import { type AiAnalysisResponse, type AiStatus } from '@/api/ai';
import { ApiError } from '@/api/client';
import { type ServiceOrder } from '@/api/orders';
import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { ProgressBar } from '@/features/buscar/ProgressBar';
import { getPhase } from '@/lib/phases';
import { useTheme } from '@/theme';
import { radius, spacing, withAlpha } from '@/theme/tokens';

export interface AiAnalyzerCardProps {
  order: ServiceOrder;
  aiStatus: AiStatus | undefined;
  isAiStatusError?: boolean;
  onAnalysisStateChange?: (inFlight: boolean) => void;
  onAnnounce?: (message: string) => void;
}

interface StageCopy {
  title: string;
  subtitle: string;
}

function getStageCopy(elapsedSeconds: number): StageCopy {
  if (elapsedSeconds < 5) {
    return {
      title: 'Enviando la foto…',
      subtitle: 'Transmitiendo imagen de forma segura al servidor',
    };
  }
  if (elapsedSeconds < 25) {
    return {
      title: 'La IA está analizando…',
      subtitle: 'Verificando la placa y evaluando el avance del lavado',
    };
  }
  return {
    title: 'Aplicando el resultado…',
    subtitle: 'Actualizando la fase de la orden de servicio',
  };
}

export function AiAnalyzerCard({
  order,
  aiStatus,
  isAiStatusError = false,
  onAnalysisStateChange,
  onAnnounce,
}: AiAnalyzerCardProps) {
  const { colors, isDark } = useTheme();
  const { mutate: analyzeImage, isPending: isAnalyzing } = useAnalyzeOrderImage();

  const [reduceMotion, setReduceMotion] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<AiAnalysisResponse | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const [pulseAnim] = useState(() => new Animated.Value(1));

  useEffect(() => {
    let isMounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (isMounted) {
          setReduceMotion(enabled);
        }
      })
      .catch(() => {});

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      setReduceMotion(enabled);
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    onAnalysisStateChange?.(isAnalyzing);
  }, [isAnalyzing, onAnalysisStateChange]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!isAnalyzing) {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
      return;
    }

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    let loop: Animated.CompositeAnimation | null = null;
    if (!reduceMotion) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.94,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
    }

    return () => {
      clearInterval(interval);
      loop?.stop();
    };
  }, [isAnalyzing, reduceMotion, pulseAnim]);

  const handleCancelAnalysis = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
  };

  const formatAnalysisError = (err: Error): string => {
    if (err instanceof ApiError) {
      if (err.code === 'REQUEST_CANCELLED') {
        return 'El análisis con IA fue cancelado por el usuario.';
      }
      if (
        err.code === 'FILE_TOO_LARGE' ||
        err.code === 'LIMIT_FILE_SIZE' ||
        err.code === 'PAYLOAD_TOO_LARGE' ||
        err.status === 413
      ) {
        return 'La fotografía supera el tamaño máximo permitido de 5 MB. Selecciona una imagen más liviana.';
      }
      if (
        err.code === 'INVALID_FILE_TYPE' ||
        err.code === 'FILE_UPLOAD_ERROR' ||
        err.code === 'FILE_MISSING' ||
        err.status === 400
      ) {
        return 'Formato de imagen no compatible o archivo inválido. Solo se aceptan fotografías JPEG, PNG o WEBP.';
      }
      if (err.code === 'WRONG_VEHICLE') {
        const details = err.details as { detected?: string; expected?: string } | undefined;
        if (details?.detected && details?.expected) {
          return `La placa detectada en la foto (${details.detected}) no coincide con la placa de esta orden (${details.expected}). Verifica que sea el vehículo correcto.`;
        }
        return 'La placa detectada en la fotografía no coincide con el vehículo de esta orden.';
      }
      if (err.code === 'PLATE_UNREADABLE' || err.status === 422) {
        return 'No se pudo leer la placa con suficiente confianza en la imagen. Intenta con una foto más clara donde la placa sea visible o usa el control manual.';
      }
      if (err.code === 'NOT_READY') {
        return 'Primero debes marcar la orden como "Lista para lavar" antes de analizar con IA.';
      }
      if (err.code === 'ALREADY_DELIVERED' || err.code === 'INVALID_STATE') {
        return 'Esta orden ya alcanzó la fase Listo o ya fue entregada.';
      }
      if (err.code === 'AI_RATE_LIMITED' || err.code === 'RATE_LIMITED' || err.status === 429) {
        return 'Se alcanzó el límite de solicitudes del servicio de IA. Espera un minuto o usa el control manual.';
      }
      if (
        err.code === 'AI_UNAVAILABLE' ||
        err.code === 'AI_ERROR' ||
        err.status === 503 ||
        err.status === 500
      ) {
        return 'El servicio de visión por IA (Gemini) falló o no está disponible temporalmente. Puedes reintentar o usar el control manual.';
      }
      if (err.code === 'REQUEST_TIMEOUT') {
        return 'El análisis superó el tiempo máximo de espera (90 s). Verifica tu conexión Wi-Fi e inténtalo de nuevo, o usa el control manual.';
      }
      if (err.code === 'NETWORK_ERROR') {
        return 'Sin conexión con el servidor durante el envío de la foto. Verifica que el backend esté activo y en la misma red Wi-Fi.';
      }
      return err.message;
    }

    return 'Ocurrió un error inesperado al procesar la respuesta del análisis. La orden permanece sin cambios.';
  };

  const handlePickAndAnalyze = async () => {
    setErrorMessage(null);

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setErrorMessage(
          'Permiso denegado para acceder a la galería. Habilita el permiso de fotos en los Ajustes de tu teléfono para analizar con IA.',
        );
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.4,
        preferredAssetRepresentationMode:
          ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
      });

      if (pickerResult.canceled || !pickerResult.assets || pickerResult.assets.length === 0) {
        return;
      }

      const selectedAsset = pickerResult.assets[0];
      setLastResult(null);

      if (
        selectedAsset.type &&
        selectedAsset.type !== 'image' &&
        selectedAsset.type !== 'livePhoto'
      ) {
        const formatMsg =
          'Formato de archivo no compatible. Selecciona una fotografía en formato JPEG, PNG o WEBP.';
        setErrorMessage(formatMsg);
        onAnnounce?.(formatMsg);
        return;
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;
      setElapsedSeconds(0);

      onAnnounce?.('Iniciando análisis con inteligencia artificial');

      analyzeImage(
        {
          orderId: order.id,
          asset: {
            uri: selectedAsset.uri,
            fileName: selectedAsset.fileName,
            mimeType: selectedAsset.mimeType,
            fileSize: selectedAsset.fileSize,
            type: selectedAsset.type,
          },
          signal: controller.signal,
        },
        {
          onSuccess: (response) => {
            abortControllerRef.current = null;
            setLastResult(response);
            const currentPhaseLabel =
              getPhase(response.phase.current)?.label ?? response.phase.current;
            if (response.phase.changed) {
              onAnnounce?.(`Análisis completado. Fase avanzada a ${currentPhaseLabel}`);
            } else {
              onAnnounce?.(
                `Análisis completado sin cambio de fase. La orden permanece en ${currentPhaseLabel}`,
              );
            }
          },
          onError: (err) => {
            abortControllerRef.current = null;
            const friendly = formatAnalysisError(err);
            setErrorMessage(friendly);
            onAnnounce?.(friendly);
          },
        },
      );
    } catch {
      setErrorMessage('No se pudo abrir la galería de fotos del dispositivo.');
    }
  };

  const isAiOffline =
    isAiStatusError && !aiStatus
      ? true
      : aiStatus
        ? aiStatus.mode === 'gemini' && !aiStatus.keyConfigured && !aiStatus.fallbackEnabled
        : false;

  const isOrderCompleted = order.faseActual === 'LISTO' || Boolean(order.deliveredAt);
  const isOrderNotReady = !order.listoParaLavar && order.faseActual === 'PENDIENTE';
  const isActionDisabled = isAnalyzing || isAiOffline || isOrderCompleted || isOrderNotReady;

  const stageCopy = getStageCopy(elapsedSeconds);
  const progressRatio = Math.min(1, elapsedSeconds / 35);
  const simulatedProgress = Math.round(12 + (1 - Math.pow(1 - progressRatio, 1.8)) * 80);

  const aiProviderBadgeLabel = aiStatus
    ? aiStatus.effectiveProvider === 'gemini'
      ? 'IA Gemini activa'
      : 'IA simulada activa'
    : isAiStatusError
      ? 'Estado IA sin conexión'
      : 'Verificando IA…';

  return (
    <Card
      variant="elevated"
      style={[
        styles.card,
        {
          borderColor: withAlpha(colors.primary, isDark ? 0.45 : 0.3),
          borderWidth: 1.5,
        },
      ]}
    >
      {/* Top Row: Title + AI Status Badge */}
      <View style={styles.headerRow}>
        <View style={styles.titleBlock}>
          <View style={styles.titleLine}>
            <Icon name="Sparkles" size={20} color={colors.primary} style={styles.titleIcon} />
            <AppText variant="subtitle" weight="bold">
              Avance inteligente con IA
            </AppText>
          </View>
          <AppText variant="caption" muted style={styles.subtitleText}>
            Selecciona una foto del vehículo desde la galería para detectar la placa y avanzar de
            fase automáticamente.
          </AppText>
        </View>
      </View>

      <View style={styles.statusRow}>
        <Badge
          label={aiProviderBadgeLabel}
          variant={isAiOffline ? 'danger' : 'primary'}
          size="sm"
        />
      </View>

      {/* Designed ~35s Waiting Experience */}
      {isAnalyzing ? (
        <View
          style={[
            styles.waitingBox,
            {
              backgroundColor: withAlpha(colors.primary, isDark ? 0.14 : 0.07),
              borderColor: withAlpha(colors.primary, isDark ? 0.35 : 0.25),
            },
          ]}
          accessible
          accessibilityRole="progressbar"
          accessibilityLiveRegion="polite"
          accessibilityLabel={`${stageCopy.title} ${stageCopy.subtitle}`}
        >
          <Animated.View
            style={[
              styles.pulseCircle,
              {
                backgroundColor: withAlpha(colors.primary, isDark ? 0.24 : 0.14),
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <Icon name="Sparkles" size={28} color={colors.primary} />
          </Animated.View>

          <AppText variant="subtitle" weight="bold" style={styles.stageTitle}>
            {stageCopy.title}
          </AppText>
          <AppText variant="caption" muted style={styles.stageSubtitle}>
            {stageCopy.subtitle}
          </AppText>

          <View style={styles.waitProgressWrapper}>
            <ProgressBar progress={simulatedProgress} color={colors.primary} height={8} />
          </View>

          <View style={styles.waitMetaRow}>
            <AppText variant="caption" weight="semiBold" style={{ color: colors.primary }}>
              {simulatedProgress}%
            </AppText>
            <AppText variant="caption" muted>
              Tiempo transcurrido: {elapsedSeconds} s (aprox. 35 s)
            </AppText>
          </View>

          <Button
            title="Cancelar análisis"
            variant="ghost"
            size="sm"
            leftIcon="X"
            onPress={handleCancelAnalysis}
            style={styles.cancelButton}
            accessibilityLabel="Cancelar análisis de imagen en curso"
          />
        </View>
      ) : (
        <View style={styles.actionArea}>
          {isOrderNotReady ? (
            <AppText variant="caption" color="warning" style={styles.helperNotice}>
              Primero marca el vehículo como &quot;Listo para lavar&quot; arriba para habilitar el
              análisis con IA.
            </AppText>
          ) : isOrderCompleted ? (
            <AppText variant="caption" color="accent" style={styles.helperNotice}>
              El vehículo ya alcanzó la fase Listo. Puedes entregarlo al cliente.
            </AppText>
          ) : isAiOffline ? (
            <AppText variant="caption" color="danger" style={styles.helperNotice}>
              El motor de IA no está disponible en este momento. Utiliza el control manual debajo.
            </AppText>
          ) : null}

          <Button
            title="Analizar con IA"
            size="lg"
            leftIcon="Camera"
            onPress={() => {
              void handlePickAndAnalyze();
            }}
            disabled={isActionDisabled}
            accessibilityLabel="Analizar con IA seleccionando una fotografía de la galería"
          />
        </View>
      )}

      {/* Error Message */}
      {errorMessage && !isAnalyzing ? (
        <View
          style={[
            styles.feedbackBox,
            {
              backgroundColor: colors.surfaceAlt,
              borderColor: colors.danger,
            },
          ]}
          accessible
          accessibilityRole="alert"
        >
          <Icon name="AlertCircle" size={18} color={colors.danger} style={styles.feedbackIcon} />
          <View style={styles.feedbackTextCol}>
            <AppText variant="caption" weight="semiBold" color="danger">
              No se pudo aplicar el análisis
            </AppText>
            <AppText variant="caption" muted style={styles.feedbackDetail}>
              {errorMessage}
            </AppText>
          </View>
        </View>
      ) : null}

      {/* Latest Analysis Result Summary (No image rendered) */}
      {lastResult && !isAnalyzing ? (
        <View
          style={[
            styles.feedbackBox,
            {
              backgroundColor: colors.surfaceAlt,
              borderColor: lastResult.phase.changed ? colors.accent : colors.info,
            },
          ]}
          accessible
          accessibilityRole="summary"
        >
          <Icon
            name={lastResult.phase.changed ? 'CircleCheck' : 'Info'}
            size={18}
            color={lastResult.phase.changed ? colors.accent : colors.info}
            style={styles.feedbackIcon}
          />
          <View style={styles.feedbackTextCol}>
            <AppText variant="caption" weight="semiBold">
              {lastResult.phase.changed
                ? `Fase avanzada automáticamente: ${getPhase(lastResult.phase.previous)?.label ?? lastResult.phase.previous} → ${getPhase(lastResult.phase.current)?.label ?? lastResult.phase.current}`
                : lastResult.phase.regression
                  ? 'Análisis completado · Sin retroceso de fase'
                  : `Análisis completado · Fase sin cambios (${getPhase(lastResult.phase.current)?.label ?? lastResult.phase.current})`}
            </AppText>
            <AppText variant="caption" muted style={styles.feedbackDetail}>
              {lastResult.phase.changed
                ? `Placa verificada: ${lastResult.plate.detected ?? lastResult.plate.expected} (${Math.round(lastResult.plate.confidence * 100)}% conf.) · Fase detectada: ${getPhase(lastResult.phase.detected)?.label ?? lastResult.phase.detected} (${Math.round(lastResult.phase.confidence * 100)}% conf.).`
                : lastResult.phase.regression
                  ? `La IA identificó la placa ${lastResult.plate.detected ?? lastResult.plate.expected} y observó una etapa anterior (${getPhase(lastResult.phase.detected)?.label ?? lastResult.phase.detected}, ${Math.round(lastResult.phase.confidence * 100)}% conf.). La orden se mantiene en ${getPhase(lastResult.phase.current)?.label ?? lastResult.phase.current} porque el lavado no retrocede automáticamente.`
                  : lastResult.phase.confidence < (aiStatus?.minConfidence ?? 0.6)
                    ? `La IA identificó la placa ${lastResult.plate.detected ?? lastResult.plate.expected}, pero la confianza en la fase (${Math.round(lastResult.phase.confidence * 100)}%) fue inferior al umbral mínimo (${Math.round((aiStatus?.minConfidence ?? 0.6) * 100)}%). La orden permanece en ${getPhase(lastResult.phase.current)?.label ?? lastResult.phase.current}.`
                    : `La IA identificó la placa ${lastResult.plate.detected ?? lastResult.plate.expected} (${Math.round(lastResult.plate.confidence * 100)}% conf.) y detectó que el vehículo sigue en la etapa ${getPhase(lastResult.phase.detected)?.label ?? lastResult.phase.detected} (${Math.round(lastResult.phase.confidence * 100)}% conf.), por lo que no hubo cambio de fase.`}
            </AppText>
            {lastResult.fallbackUsed ? (
              <AppText variant="caption" muted style={styles.fallbackNotice}>
                Nota: se utilizó el proveedor simulado de respaldo ante demora de Gemini.
              </AppText>
            ) : null}
          </View>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing[16],
    marginBottom: spacing[16],
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[8],
  },
  titleBlock: {
    flex: 1,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleIcon: {
    marginRight: 8,
  },
  subtitleText: {
    lineHeight: 18,
  },
  statusRow: {
    flexDirection: 'row',
    marginBottom: spacing[16],
  },
  actionArea: {
    width: '100%',
  },
  helperNotice: {
    marginBottom: spacing[12],
    lineHeight: 18,
  },
  waitingBox: {
    borderRadius: radius[16],
    borderWidth: 1,
    padding: spacing[16],
    alignItems: 'center',
  },
  pulseCircle: {
    width: 60,
    height: 60,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[12],
  },
  stageTitle: {
    textAlign: 'center',
    marginBottom: 4,
  },
  stageSubtitle: {
    textAlign: 'center',
    marginBottom: spacing[16],
  },
  waitProgressWrapper: {
    width: '100%',
    marginBottom: spacing[8],
  },
  waitMetaRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  cancelButton: {
    marginTop: spacing[4],
  },
  feedbackBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: radius[12],
    borderWidth: 1,
    padding: spacing[12],
    marginTop: spacing[12],
  },
  feedbackIcon: {
    marginRight: spacing[8],
    marginTop: 2,
  },
  feedbackTextCol: {
    flex: 1,
  },
  feedbackDetail: {
    marginTop: 2,
    lineHeight: 18,
  },
  fallbackNotice: {
    marginTop: 4,
    fontStyle: 'italic',
  },
});
