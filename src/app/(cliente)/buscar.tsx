import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, RefreshControl, StyleSheet, View } from 'react-native';
import { useIsFocused } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { PlateSearchField } from '@/features/buscar/PlateSearchField';
import { RecentSearches } from '@/features/buscar/RecentSearches';
import { StatusCard } from '@/features/buscar/StatusCard';
import { MY_PLATES_QUERY_KEY } from '@/features/buscar/useMyPlates';
import { usePlateStatus } from '@/features/buscar/usePlateStatus';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useAuth } from '@/features/auth';
import { getPhase } from '@/lib/phases';
import { useTheme } from '@/theme';
import { radius, spacing, withAlpha } from '@/theme/tokens';

export default function BuscarScreen() {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const isFocused = useIsFocused();
  const queryClient = useQueryClient();
  const [inputText, setInputText] = useState('');
  const [searchedPlate, setSearchedPlate] = useState('');
  const [liveAnnouncement, setLiveAnnouncement] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const previousPhaseRef = useRef<string | null>(null);

  const { data, isPending, isFetching, isNotFound, isRateLimited, isNetworkError, refetch } =
    usePlateStatus(searchedPlate);

  useEffect(() => {
    if (data?.fase && data.fase !== previousPhaseRef.current) {
      const phaseInfo = getPhase(data.fase);
      const label = phaseInfo?.label ?? data.fase;
      const announcement = `Fase actual: ${label}, ${data.porcentajeProgreso} por ciento`;
      setLiveAnnouncement(announcement);
      previousPhaseRef.current = data.fase;
    }
  }, [data?.fase, data?.porcentajeProgreso]);

  const greetingName = user?.nombre ? user.nombre.split(' ')[0] : 'Cliente';

  const handleSearch = (plate: string) => {
    setInputText(plate);
    setSearchedPlate(plate);
  };

  const handleNewSearch = useCallback(() => {
    setSearchedPlate('');
    setInputText('');
    setLiveAnnouncement('');
    previousPhaseRef.current = null;
  }, []);

  const hasResultOnScreen = Boolean(searchedPlate);

  useEffect(() => {
    if (!isFocused || !hasResultOnScreen) {
      return;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handleNewSearch();
      return true;
    });

    return () => {
      subscription.remove();
    };
  }, [isFocused, hasResultOnScreen, handleNewSearch]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (user?.role === 'CLIENTE') {
        await queryClient.refetchQueries({ queryKey: MY_PLATES_QUERY_KEY });
      }
      if (searchedPlate) {
        await refetch();
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [user?.role, queryClient, searchedPlate, refetch]);

  const isStatusCardVisible = Boolean(searchedPlate && data && !isNotFound);
  const isSearchLoading = Boolean(
    searchedPlate && isPending && !data && !isNotFound && !isNetworkError && !isRateLimited,
  );
  const showRecentSearches = user?.role === 'CLIENTE' && !isStatusCardVisible && !isSearchLoading;

  return (
    <ScreenContainer
      scroll
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
          progressBackgroundColor={colors.surface}
        />
      }
    >
      {/* Accessibility live region for screen reader announcements */}
      <View
        accessible
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
        style={styles.srOnly}
      >
        <AppText>{liveAnnouncement}</AppText>
      </View>

      {/* Header Greeting */}
      <View style={styles.header}>
        <AppText variant="title" weight="bold" style={styles.greetingTitle}>
          Hola, {greetingName}
        </AppText>
        <AppText variant="caption" muted>
          Consulta el estado de tu vehículo en tiempo real
        </AppText>
      </View>

      {/* Search Input Field */}
      <PlateSearchField
        value={inputText}
        onChangeText={setInputText}
        onSearch={handleSearch}
        loading={isFetching && !data}
      />

      {/* 1. Loading State (First fetch) */}
      {isSearchLoading && (
        <Card variant="outlined" style={styles.stateCard}>
          <ActivityIndicator size="large" color={colors.primary} style={styles.stateIcon} />
          <AppText variant="body" muted style={styles.loadingMessage}>
            Buscando estado del vehículo...
          </AppText>
        </Card>
      )}

      {/* 2. 404 Not Found State */}
      {searchedPlate && isNotFound && (
        <Card variant="outlined" style={styles.stateCard}>
          <View style={[styles.iconCircle, { backgroundColor: colors.surfaceAlt }]}>
            <Icon name="Search" size={26} color={colors.textMuted} />
          </View>
          <AppText variant="subtitle" weight="semiBold" style={styles.notFoundMessage}>
            No hay un carro lavándose con esta placa
          </AppText>
          <Button
            title="Nueva búsqueda"
            variant="secondary"
            onPress={handleNewSearch}
            style={styles.actionButton}
            accessibilityLabel="Iniciar una nueva búsqueda de placa"
          />
        </Card>
      )}

      {/* 3. Network Error WITHOUT data */}
      {searchedPlate && isNetworkError && !data && !isNotFound && (
        <Card variant="outlined" style={styles.stateCard}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: withAlpha(colors.danger, isDark ? 0.18 : 0.1) },
            ]}
          >
            <Icon name="WifiOff" size={26} color={colors.danger} />
          </View>
          <AppText variant="subtitle" weight="semiBold" style={styles.stateTitle}>
            Sin conexión con el servidor
          </AppText>
          <AppText variant="caption" muted style={styles.stateDescription}>
            Verifica tu conexión a internet o el estado del backend e inténtalo de nuevo.
          </AppText>
          <Button
            title="Reintentar"
            leftIcon="RefreshCw"
            onPress={() => refetch()}
            loading={isFetching}
            style={styles.actionButton}
            accessibilityLabel="Reintentar consulta de placa"
          />
        </Card>
      )}

      {/* 4. 429 Rate Limited WITHOUT data */}
      {searchedPlate && isRateLimited && !data && !isNotFound && (
        <Card variant="outlined" style={styles.stateCard}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: withAlpha(colors.warning, isDark ? 0.18 : 0.1) },
            ]}
          >
            <Icon name="Clock" size={26} color={colors.warning} />
          </View>
          <AppText variant="subtitle" weight="semiBold" style={styles.stateTitle}>
            Límite de consultas alcanzado
          </AppText>
          <AppText variant="caption" muted style={styles.stateDescription}>
            Has alcanzado el límite de consultas. Esperando unos momentos antes de reintentar.
          </AppText>
          <Button
            title="Nueva búsqueda"
            variant="secondary"
            onPress={handleNewSearch}
            style={styles.actionButton}
          />
        </Card>
      )}

      {/* 5. Recent Searches Section (Hidden while StatusCard is displayed) */}
      {showRecentSearches && (
        <RecentSearches onSelectPlate={handleSearch} onAnnounce={setLiveAnnouncement} />
      )}

      {/* 6. Success State (Active Order Data) */}
      {isStatusCardVisible && data && (
        <View style={styles.successContainer}>
          {/* Offline Banner when network fails but previous data is retained */}
          {isNetworkError && (
            <View
              style={[
                styles.offlineBanner,
                {
                  backgroundColor: withAlpha(colors.warning, isDark ? 0.14 : 0.08),
                  borderColor: withAlpha(colors.warning, isDark ? 0.4 : 0.3),
                },
              ]}
              accessibilityRole="alert"
            >
              <Icon name="WifiOff" size={16} color={colors.warning} style={styles.bannerIcon} />
              <AppText variant="caption" style={[styles.bannerText, { color: colors.warning }]}>
                Sin conexión. Mostrando el último estado.
              </AppText>
            </View>
          )}

          <StatusCard status={data} />

          <Button
            title="Nueva búsqueda"
            variant="secondary"
            onPress={handleNewSearch}
            style={styles.successNewSearchButton}
            accessibilityLabel="Buscar otra placa"
          />
        </View>
      )}
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
  greetingTitle: {
    fontSize: 26,
    lineHeight: 32,
    marginBottom: 4,
  },
  stateCard: {
    alignItems: 'center',
    paddingVertical: spacing[32],
    paddingHorizontal: spacing[16],
    marginTop: spacing[8],
    marginBottom: spacing[16],
  },
  stateIcon: {
    marginBottom: spacing[16],
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[12],
  },
  loadingMessage: {
    textAlign: 'center',
  },
  notFoundMessage: {
    textAlign: 'center',
    marginBottom: spacing[16],
  },
  stateTitle: {
    textAlign: 'center',
    marginBottom: spacing[8],
  },
  stateDescription: {
    textAlign: 'center',
    marginBottom: spacing[16],
    paddingHorizontal: spacing[8],
  },
  actionButton: {
    minWidth: 160,
  },
  successContainer: {
    width: '100%',
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[8],
    paddingHorizontal: spacing[12],
    borderRadius: radius[12],
    borderWidth: 1,
    marginBottom: spacing[12],
  },
  bannerIcon: {
    marginRight: 6,
  },
  bannerText: {
    fontWeight: '500',
  },
  successNewSearchButton: {
    alignSelf: 'center',
    marginTop: spacing[4],
    minWidth: 180,
  },
  srOnly: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    overflow: 'hidden',
  },
});
