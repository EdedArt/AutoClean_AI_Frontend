import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Alert,
  Animated,
  AppState,
  type AppStateStatus,
  Easing,
  StyleSheet,
  View,
} from 'react-native';
import { useIsFocused } from 'expo-router';

import { HistoryItem } from './HistoryItem';
import { HistorySkeleton } from './HistorySkeleton';
import {
  HistoryEmptyState,
  HistoryErrorState,
  HistoryOfflineBanner,
  HistoryRateLimitBanner,
  HistoryRollbackBanner,
} from './HistoryStates';
import { useDeleteMyPlate } from './useDeleteMyPlate';
import { useMyPlates } from './useMyPlates';
import { AppText } from '@/components/AppText';
import { spacing } from '@/theme/tokens';

export interface RecentSearchesProps {
  onSelectPlate: (placa: string) => void;
  onAnnounce?: (message: string) => void;
}

export function RecentSearches({ onSelectPlate, onAnnounce }: RecentSearchesProps) {
  const isScreenFocused = useIsFocused();
  const [reduceMotion, setReduceMotion] = useState(false);
  const [appState, setAppState] = useState<AppStateStatus>(
    () => (AppState.currentState as AppStateStatus) || 'active',
  );

  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [translateAnim] = useState(() => new Animated.Value(8));
  const hasAnimatedRef = useRef(false);

  const { data, isPending, isFetching, isError, isRateLimited, isNetworkError, refetch } =
    useMyPlates();

  const {
    mutate: deletePlate,
    rollbackError,
    clearRollbackError,
  } = useDeleteMyPlate({
    onSuccess: (placa) => {
      onAnnounce?.(`Placa ${placa} eliminada del historial`);
    },
    onRollback: (_placa, message) => {
      onAnnounce?.(message);
    },
  });

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
    const subscription = AppState.addEventListener('change', (nextState) => {
      setAppState(nextState);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const isAppActive = appState === 'active';
  const shouldAnimate = !reduceMotion && isScreenFocused && isAppActive;
  const hasData = Array.isArray(data);
  const entries = data ?? [];

  useEffect(() => {
    if (!hasData) {
      return;
    }

    if (!shouldAnimate) {
      fadeAnim.stopAnimation();
      translateAnim.stopAnimation();
      fadeAnim.setValue(1);
      translateAnim.setValue(0);
      hasAnimatedRef.current = true;
      return;
    }

    if (!hasAnimatedRef.current) {
      hasAnimatedRef.current = true;
      fadeAnim.setValue(0);
      translateAnim.setValue(8);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateAnim, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [hasData, shouldAnimate, fadeAnim, translateAnim]);

  const handleConfirmDelete = (placa: string) => {
    Alert.alert('Quitar del historial', `¿Quitar ${placa} de tu historial?`, [
      {
        text: 'Cancelar',
        style: 'cancel',
      },
      {
        text: 'Quitar',
        style: 'destructive',
        onPress: () => {
          deletePlate(placa);
        },
      },
    ]);
  };

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <AppText
          variant="subtitle"
          weight="semiBold"
          accessibilityRole="header"
          style={styles.sectionTitle}
        >
          Búsquedas recientes
        </AppText>
      </View>

      {rollbackError ? (
        <HistoryRollbackBanner message={rollbackError} onDismiss={clearRollbackError} />
      ) : null}

      {/* 1. Loading Skeleton (Initial load with no cached data) */}
      {isPending && !hasData ? <HistorySkeleton rows={3} /> : null}

      {/* 2. Error State when no cached data is available */}
      {isError && !hasData ? (
        <HistoryErrorState
          isRateLimited={isRateLimited}
          isNetworkError={isNetworkError}
          isFetching={isFetching}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : null}

      {/* 3. Data available (either live or cached while offline/rate-limited) */}
      {hasData ? (
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: translateAnim }],
          }}
        >
          {isNetworkError ? <HistoryOfflineBanner /> : null}
          {!isNetworkError && isRateLimited ? <HistoryRateLimitBanner /> : null}

          {entries.length === 0 ? (
            <HistoryEmptyState />
          ) : (
            <View accessibilityRole="list">
              {entries.map((entry) => (
                <HistoryItem
                  key={entry.placa}
                  entry={entry}
                  onSelect={onSelectPlate}
                  onDelete={handleConfirmDelete}
                />
              ))}
            </View>
          )}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    width: '100%',
    marginTop: spacing[8],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[12],
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
  },
});
