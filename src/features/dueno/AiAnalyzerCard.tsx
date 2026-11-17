import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

import { useAnalyzeOrderImage } from './useOrderMutations';
import { type AiAnalysisResponse, type AiOutcome, type AiStatus } from '@/api/ai';
import { ApiError } from '@/api/client';
import { type ServiceOrder } from '@/api/orders';
import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { formatRemainingTime } from '@/lib/i18nFormat';
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
  stepIndex: number;
  titleKey: string;
  subtitleKey: string;
}

const STAGE_LABEL_KEYS = [
  'aiCard.stageSending',
  'aiCard.stageAnalyzing',
  'aiCard.stageApplying',
] as const;

function getStageCopy(elapsedSeconds: number): StageCopy {
  if (elapsedSeconds < 5) {
    return {
      stepIndex: 0,
      titleKey: 'aiCard.sendingTitle',
      subtitleKey: 'aiCard.sendingSubtitle',
    };
  }
  if (elapsedSeconds < 25) {
    return {
      stepIndex: 1,
      titleKey: 'aiCard.analyzingTitle',
      subtitleKey: 'aiCard.analyzingSubtitle',
    };
  }
  return {
    stepIndex: 2,
    titleKey: 'aiCard.applyingTitle',
    subtitleKey: 'aiCard.applyingSubtitle',
  };
}

type OutcomeTone = 'success' | 'warning' | 'info';

interface OutcomeView {
  tone: OutcomeTone;
  icon: 'CircleCheck' | 'Clock' | 'Info' | 'AlertCircle';
  title: string;
  detail: string;
  highlight: string | null;
}

/** Normalizes the analysis result into an explicit outcome (older backends had no `outcome`). */
function resolveOutcome(result: AiAnalysisResponse): AiOutcome {
  if (result.outcome) {
    return result.outcome;
  }
  return {
    code: result.phase.changed ? 'ADVANCED' : 'SAME_OR_PREVIOUS_PHASE',
    from: result.phase.previous,
    to: result.phase.current,
    detected: result.phase.detected,
    confidence: result.phase.confidence,
    remainingMs: 0,
    requiredMs: 0,
  };
}

function describeOutcome(t: TFunction, result: AiAnalysisResponse): OutcomeView {
  const outcome = resolveOutcome(result);
  const phaseLabel = (code: string | null | undefined) =>
    code ? t(`phases.${code}`, { defaultValue: code }) : '—';
  const from = phaseLabel(outcome.from);
  const current = phaseLabel(result.phase.current);
  const detected = phaseLabel(outcome.detected ?? result.phase.detected);

  switch (outcome.code) {
    case 'ADVANCED':
      return {
        tone: 'success',
        icon: 'CircleCheck',
        title: t('aiOutcome.advancedTitle', { from, to: phaseLabel(outcome.to) }),
        detail: t('aiOutcome.advancedDetail', {
          to: phaseLabel(outcome.to),
          progress: result.order.porcentajeProgreso,
        }),
        highlight: null,
      };
    case 'BLOCKED_MIN_TIME': {
      const remaining = formatRemainingTime(outcome.remainingMs ?? 0);
      return {
        tone: 'warning',
        icon: 'Clock',
        title: t('aiOutcome.blockedTitle'),
        detail: t('aiOutcome.blockedDetail', { detected, current }),
        highlight: t('aiOutcome.remaining', { remaining }),
      };
    }
    case 'PHASE_NOT_IN_PACKAGE':
      return {
        tone: 'warning',
        icon: 'AlertCircle',
        title: t('aiOutcome.notInPackageTitle'),
        detail: t('aiOutcome.notInPackageDetail', { detected, current }),
        highlight: null,
      };
    case 'LOW_CONFIDENCE':
      return {
        tone: 'warning',
        icon: 'AlertCircle',
        title: t('aiOutcome.lowConfidenceTitle'),
        detail: t('aiOutcome.lowConfidenceDetail', {
          detected,
          confidence: Math.round((outcome.confidence ?? result.phase.confidence) * 100),
          min: Math.round((outcome.minConfidence ?? 0.6) * 100),
        }),
        highlight: null,
      };
    case 'SAME_OR_PREVIOUS_PHASE':
    default:
      return result.phase.regression
        ? {
            tone: 'info',
            icon: 'Info',
            title: t('aiOutcome.previousTitle'),
            detail: t('aiOutcome.previousDetail', { detected, current }),
            highlight: null,
          }
        : {
            tone: 'info',
            icon: 'Info',
            title: t('aiOutcome.sameTitle'),
            detail: t('aiOutcome.sameDetail', { current }),
            highlight: null,
          };
  }
}

export function AiAnalyzerCard({
  order,
  aiStatus,
  isAiStatusError = false,
  onAnalysisStateChange,
  onAnnounce,
}: AiAnalyzerCardProps) {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { mutate: analyzeImage, isPending: isAnalyzing } = useAnalyzeOrderImage();

  const [reduceMotion, setReduceMotion] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<{ title: string; message: string } | null>(
    null,
  );
  const [lastResult, setLastResult] = useState<AiAnalysisResponse | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const [pulseAnim] = useState(() => new Animated.Value(1));
  const [sweepAnim] = useState(() => new Animated.Value(0));

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
      sweepAnim.stopAnimation();
      pulseAnim.setValue(1);
      sweepAnim.setValue(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    let pulseLoop: Animated.CompositeAnimation | null = null;
    let sweepLoop: Animated.CompositeAnimation | null = null;

    if (!reduceMotion) {
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.07,
            duration: 950,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.95,
            duration: 950,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );

      sweepLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(sweepAnim, {
            toValue: 1,
            duration: 1700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(sweepAnim, {
            toValue: 0,
            duration: 1700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );

      pulseLoop.start();
      sweepLoop.start();
    }

    return () => {
      clearInterval(interval);
      pulseLoop?.stop();
      sweepLoop?.stop();
    };
  }, [isAnalyzing, reduceMotion, pulseAnim, sweepAnim]);

  const handleCancelAnalysis = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
  };

  const formatAnalysisError = (err: Error): { title: string; message: string } => {
    const failed = t('orderDetail.aiErrorTitle');
    if (err instanceof ApiError) {
      if (err.code === 'REQUEST_CANCELLED') {
        return { title: failed, message: t('aiErrors.cancelled') };
      }
      if (err.code === 'FILE_READ_ERROR' || err.code === 'CLIENT_REQUEST_ERROR') {
        return { title: failed, message: t('aiErrors.fileRead') };
      }
      if (
        err.code === 'FILE_TOO_LARGE' ||
        err.code === 'LIMIT_FILE_SIZE' ||
        err.code === 'PAYLOAD_TOO_LARGE' ||
        err.status === 413
      ) {
        return { title: failed, message: t('aiErrors.fileTooLarge') };
      }
      if (err.code === 'WRONG_VEHICLE') {
        const details = err.details as { detected?: string; expected?: string } | undefined;
        return {
          title: t('aiOutcome.plateMismatchTitle'),
          message:
            details?.detected && details?.expected
              ? t('aiOutcome.plateMismatchDetail', {
                  detected: details.detected,
                  expected: details.expected,
                })
              : t('aiOutcome.plateMismatchGeneric'),
        };
      }
      if (err.code === 'PLATE_UNREADABLE' || err.status === 422) {
        return {
          title: t('aiOutcome.plateUnreadableTitle'),
          message: t('aiOutcome.plateUnreadableDetail'),
        };
      }
      if (
        err.code === 'INVALID_FILE_TYPE' ||
        err.code === 'FILE_UPLOAD_ERROR' ||
        err.code === 'FILE_MISSING' ||
        err.status === 400
      ) {
        return { title: failed, message: t('aiErrors.invalidFile') };
      }
      if (err.code === 'NOT_READY') {
        return { title: failed, message: t('aiErrors.notReady') };
      }
      if (err.code === 'ALREADY_DELIVERED' || err.code === 'INVALID_STATE') {
        return { title: failed, message: t('aiErrors.alreadyDone') };
      }
      if (err.code === 'AI_RATE_LIMITED' || err.code === 'RATE_LIMITED' || err.status === 429) {
        return { title: failed, message: t('aiErrors.rateLimited') };
      }
      if (
        err.code === 'AI_UNAVAILABLE' ||
        err.code === 'AI_ERROR' ||
        err.status === 503 ||
        err.status === 500
      ) {
        return { title: failed, message: t('aiErrors.unavailable') };
      }
      if (err.code === 'REQUEST_TIMEOUT') {
        return { title: failed, message: t('aiErrors.timeout') };
      }
      if (err.code === 'NETWORK_ERROR') {
        return { title: failed, message: t('aiErrors.network') };
      }
    }

    return { title: failed, message: t('aiErrors.unexpected') };
  };

  const handlePickAndAnalyze = async () => {
    setErrorMessage(null);

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setErrorMessage({
          title: t('orderDetail.aiErrorTitle'),
          message: t('aiErrors.permissionDenied'),
        });
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
        const formatMsg = t('aiErrors.invalidFile');
        setErrorMessage({ title: t('orderDetail.aiErrorTitle'), message: formatMsg });
        onAnnounce?.(formatMsg);
        return;
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;
      setElapsedSeconds(0);

      onAnnounce?.(t('aiCard.announceStart'));

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
            const view = describeOutcome(t, response);
            onAnnounce?.(
              [view.title, view.detail, view.highlight].filter(Boolean).join('. '),
            );
          },
          onError: (err) => {
            abortControllerRef.current = null;
            const friendly = formatAnalysisError(err);
            setErrorMessage(friendly);
            onAnnounce?.(`${friendly.title}. ${friendly.message}`);
          },
        },
      );
    } catch {
      setErrorMessage({
        title: t('orderDetail.aiErrorTitle'),
        message: t('profile.openGalleryError'),
      });
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
  const stageTitle = t(stageCopy.titleKey);
  const stageSubtitle = t(stageCopy.subtitleKey);

  const outcomeView = lastResult ? describeOutcome(t, lastResult) : null;
  const outcomeColor = outcomeView
    ? outcomeView.tone === 'success'
      ? colors.accent
      : outcomeView.tone === 'warning'
        ? colors.warning
        : colors.info
    : colors.info;

  const sweepTranslateX = sweepAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-90, 180],
  });

  const aiProviderBadgeLabel = aiStatus
    ? aiStatus.effectiveProvider === 'gemini'
      ? t('orderDetail.aiGeminiActive')
      : t('orderDetail.aiCameraActive')
    : isAiStatusError
      ? t('orderDetail.aiOfflineStatus')
      : t('orderDetail.aiChecking');

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
        <View
          style={[
            styles.headerIconBadge,
            { backgroundColor: withAlpha(colors.primary, isDark ? 0.2 : 0.1) },
          ]}
        >
          <Icon name="Sparkles" size={20} color={colors.primary} />
        </View>
        <View style={styles.titleBlock}>
          <View style={styles.titleTopRow}>
            <AppText variant="subtitle" weight="bold" style={styles.titleText}>
              {t('orderDetail.aiTitle')}
            </AppText>
            <Badge
              label={aiProviderBadgeLabel}
              variant={isAiOffline ? 'danger' : 'primary'}
              size="sm"
            />
          </View>
          <AppText variant="caption" muted style={styles.subtitleText}>
            {t('orderDetail.aiDescription')}
          </AppText>
        </View>
      </View>

      {/* Designed ~35s Waiting Experience (without faking a precise percentage) */}
      {isAnalyzing ? (
        <View
          style={[
            styles.waitingBox,
            {
              backgroundColor: withAlpha(colors.primary, isDark ? 0.11 : 0.06),
              borderColor: withAlpha(colors.primary, isDark ? 0.35 : 0.24),
            },
          ]}
          accessible
          accessibilityRole="progressbar"
          accessibilityLiveRegion="polite"
          accessibilityLabel={`${stageTitle} ${stageSubtitle}`}
        >
          <View style={styles.waitingHeaderRow}>
            <Animated.View
              style={[
                styles.pulseCircle,
                {
                  backgroundColor: withAlpha(colors.primary, isDark ? 0.24 : 0.14),
                  borderColor: withAlpha(colors.primary, isDark ? 0.45 : 0.3),
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <Icon name="Sparkles" size={24} color={colors.primary} />
            </Animated.View>

            <View style={styles.waitingCopyBlock}>
              <AppText variant="subtitle" weight="bold" style={styles.stageTitle}>
                {stageTitle}
              </AppText>
              <AppText variant="caption" muted style={styles.stageSubtitle}>
                {stageSubtitle}
              </AppText>
            </View>
          </View>

          {/* Continuous calm activity bar without fake percentage */}
          <View
            style={[
              styles.continuousTrack,
              { backgroundColor: withAlpha(colors.primary, isDark ? 0.2 : 0.14) },
            ]}
          >
            {reduceMotion ? (
              <View style={[styles.staticIndicatorBar, { backgroundColor: colors.primary }]} />
            ) : (
              <Animated.View
                style={[
                  styles.sweepIndicatorBar,
                  {
                    backgroundColor: colors.primary,
                    transform: [{ translateX: sweepTranslateX }],
                  },
                ]}
              />
            )}
          </View>

          {/* 3-stage calm step pills */}
          <View style={styles.stageStepsRow}>
            {STAGE_LABEL_KEYS.map((labelKey, index) => {
              const label = t(labelKey);
              const isCompleted = index < stageCopy.stepIndex;
              const isCurrent = index === stageCopy.stepIndex;
              const dotColor = isCompleted || isCurrent ? colors.primary : colors.disabledText;

              return (
                <View key={labelKey} style={styles.stageStepItem}>
                  <View
                    style={[
                      styles.stageStepDot,
                      {
                        backgroundColor: dotColor,
                        transform: [{ scale: isCurrent ? 1.2 : 1 }],
                      },
                    ]}
                  />
                  <AppText
                    variant="caption"
                    weight={isCurrent ? 'semiBold' : 'regular'}
                    style={{
                      color: isCurrent
                        ? colors.primary
                        : isCompleted
                          ? colors.text
                          : colors.textMuted,
                    }}
                  >
                    {label}
                  </AppText>
                </View>
              );
            })}
          </View>

          <View style={styles.waitFooterRow}>
            <View
              style={[
                styles.elapsedBadge,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Icon name="Clock" size={13} color={colors.primary} style={styles.elapsedIcon} />
              <AppText variant="caption" muted>
                {t('aiCard.elapsed', { seconds: elapsedSeconds })}
              </AppText>
            </View>

            <Button
              title={t('orderDetail.aiCancelButton')}
              variant="secondary"
              size="sm"
              leftIcon="X"
              onPress={handleCancelAnalysis}
              style={styles.cancelButton}
              accessibilityLabel={t('orderDetail.aiCancelButton')}
            />
          </View>
        </View>
      ) : (
        <View style={styles.actionArea}>
          {isOrderNotReady ? (
            <View
              style={[
                styles.helperNoticeBox,
                {
                  backgroundColor: withAlpha(colors.warning, isDark ? 0.14 : 0.08),
                  borderColor: withAlpha(colors.warning, isDark ? 0.35 : 0.25),
                },
              ]}
            >
              <Icon name="Info" size={15} color={colors.warning} />
              <AppText variant="caption" color="warning" style={styles.helperNoticeText}>
                {t('orderDetail.aiNotReadyHint')}
              </AppText>
            </View>
          ) : isOrderCompleted ? (
            <View
              style={[
                styles.helperNoticeBox,
                {
                  backgroundColor: withAlpha(colors.accent, isDark ? 0.14 : 0.08),
                  borderColor: withAlpha(colors.accent, isDark ? 0.35 : 0.25),
                },
              ]}
            >
              <Icon name="CircleCheck" size={15} color={colors.accent} />
              <AppText variant="caption" color="accent" style={styles.helperNoticeText}>
                {t('orderDetail.aiCompletedHint')}
              </AppText>
            </View>
          ) : isAiOffline ? (
            <View
              style={[
                styles.helperNoticeBox,
                {
                  backgroundColor: withAlpha(colors.danger, isDark ? 0.14 : 0.08),
                  borderColor: withAlpha(colors.danger, isDark ? 0.35 : 0.25),
                },
              ]}
            >
              <Icon name="AlertCircle" size={15} color={colors.danger} />
              <AppText variant="caption" color="danger" style={styles.helperNoticeText}>
                {t('orderDetail.aiOfflineHint')}
              </AppText>
            </View>
          ) : null}

          <Button
            title={t('orderDetail.analyzeWithAI')}
            size="lg"
            leftIcon="Camera"
            fullWidth
            onPress={() => {
              void handlePickAndAnalyze();
            }}
            disabled={isActionDisabled}
            accessibilityLabel={t('orderDetail.analyzeWithAI')}
          />
        </View>
      )}

      {/* Unified Error Feedback Card */}
      {errorMessage && !isAnalyzing ? (
        <View
          style={[
            styles.feedbackCard,
            {
              backgroundColor: withAlpha(colors.danger, isDark ? 0.12 : 0.06),
              borderColor: withAlpha(colors.danger, isDark ? 0.38 : 0.26),
            },
          ]}
          accessible
          accessibilityRole="alert"
        >
          <View style={[styles.feedbackAccentBar, { backgroundColor: colors.danger }]} />
          <View style={styles.feedbackBody}>
            <View style={styles.feedbackHeaderLine}>
              <View
                style={[
                  styles.feedbackIconCircle,
                  { backgroundColor: withAlpha(colors.danger, isDark ? 0.22 : 0.14) },
                ]}
              >
                <Icon name="AlertCircle" size={16} color={colors.danger} />
              </View>
              <AppText variant="caption" weight="bold" color="danger" style={styles.feedbackTitle}>
                {errorMessage.title}
              </AppText>
            </View>
            <AppText variant="caption" muted style={styles.feedbackDetail}>
              {errorMessage.message}
            </AppText>
          </View>
        </View>
      ) : null}

      {/* Analysis outcome card: success (advanced), warning (blocked / not applied) or info */}
      {lastResult && outcomeView && !isAnalyzing ? (
        <View
          style={[
            styles.feedbackCard,
            {
              backgroundColor: withAlpha(outcomeColor, isDark ? 0.12 : 0.06),
              borderColor: withAlpha(outcomeColor, isDark ? 0.38 : 0.26),
            },
          ]}
          accessible
          accessibilityRole="summary"
          accessibilityLiveRegion="polite"
          accessibilityLabel={[outcomeView.title, outcomeView.detail, outcomeView.highlight]
            .filter(Boolean)
            .join('. ')}
        >
          <View style={[styles.feedbackAccentBar, { backgroundColor: outcomeColor }]} />
          <View style={styles.feedbackBody}>
            <View style={styles.feedbackHeaderLine}>
              <View
                style={[
                  styles.feedbackIconCircle,
                  { backgroundColor: withAlpha(outcomeColor, isDark ? 0.22 : 0.14) },
                ]}
              >
                <Icon name={outcomeView.icon} size={16} color={outcomeColor} />
              </View>
              <AppText
                variant="caption"
                weight="bold"
                style={[styles.feedbackTitle, { color: outcomeColor }]}
              >
                {outcomeView.title}
              </AppText>
            </View>

            <AppText variant="caption" style={styles.feedbackDetail}>
              {outcomeView.detail}
            </AppText>

            {outcomeView.highlight ? (
              <View
                style={[
                  styles.highlightPill,
                  {
                    backgroundColor: withAlpha(outcomeColor, isDark ? 0.2 : 0.12),
                    borderColor: withAlpha(outcomeColor, isDark ? 0.45 : 0.3),
                  },
                ]}
              >
                <Icon name="Clock" size={13} color={outcomeColor} />
                <AppText variant="caption" weight="bold" style={{ color: outcomeColor }}>
                  {outcomeView.highlight}
                </AppText>
              </View>
            ) : null}

            <AppText variant="caption" muted style={styles.summaryLine}>
              {t('aiOutcome.summary', {
                plate: lastResult.plate.detected ?? lastResult.plate.expected,
                plateConfidence: Math.round(lastResult.plate.confidence * 100),
                phase: t(`phases.${lastResult.phase.detected}`, {
                  defaultValue: lastResult.phase.detected,
                }),
                phaseConfidence: Math.round(lastResult.phase.confidence * 100),
              })}
            </AppText>

            {lastResult.fallbackUsed ? (
              <AppText variant="caption" muted style={styles.fallbackNotice}>
                {t('aiCard.fallbackNotice')}
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
    alignItems: 'flex-start',
    marginBottom: spacing[16],
  },
  headerIconBadge: {
    width: 44,
    height: 44,
    borderRadius: radius[12],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[12],
  },
  titleBlock: {
    flex: 1,
  },
  titleTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing[8],
    marginBottom: 4,
  },
  titleText: {
    flexShrink: 1,
  },
  subtitleText: {
    lineHeight: 18,
  },
  actionArea: {
    width: '100%',
  },
  helperNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[8],
    borderRadius: radius[12],
    borderWidth: 1,
    marginBottom: spacing[12],
    gap: spacing[8],
  },
  helperNoticeText: {
    flex: 1,
    lineHeight: 18,
  },
  waitingBox: {
    borderRadius: radius[16],
    borderWidth: 1,
    padding: spacing[16],
  },
  waitingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[16],
  },
  pulseCircle: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[12],
  },
  waitingCopyBlock: {
    flex: 1,
  },
  stageTitle: {
    marginBottom: 2,
  },
  stageSubtitle: {
    lineHeight: 18,
  },
  continuousTrack: {
    width: '100%',
    height: 6,
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginBottom: spacing[12],
  },
  sweepIndicatorBar: {
    width: 120,
    height: '100%',
    borderRadius: radius.pill,
  },
  staticIndicatorBar: {
    width: '50%',
    height: '100%',
    borderRadius: radius.pill,
  },
  stageStepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    marginBottom: spacing[16],
  },
  stageStepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stageStepDot: {
    width: 7,
    height: 7,
    borderRadius: radius.pill,
  },
  waitFooterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing[8],
  },
  elapsedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[12],
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  elapsedIcon: {
    marginRight: 6,
  },
  cancelButton: {
    minWidth: 148,
  },
  feedbackCard: {
    flexDirection: 'row',
    borderRadius: radius[12],
    borderWidth: 1,
    marginTop: spacing[16],
    overflow: 'hidden',
  },
  feedbackAccentBar: {
    width: 4,
  },
  feedbackBody: {
    flex: 1,
    padding: spacing[12],
  },
  feedbackHeaderLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: spacing[8],
  },
  feedbackIconCircle: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackTitle: {
    flex: 1,
  },
  feedbackDetail: {
    lineHeight: 18,
  },
  highlightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: spacing[8],
    paddingHorizontal: spacing[12],
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  summaryLine: {
    marginTop: spacing[8],
    lineHeight: 18,
  },
  fallbackNotice: {
    marginTop: 6,
    fontStyle: 'italic',
  },
});
