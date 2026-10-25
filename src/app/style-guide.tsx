import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import {
  AppIconName,
  AppText,
  Badge,
  Button,
  Card,
  Icon,
  ICON_MAP,
  Logo,
  ScreenContainer,
  TextField,
  ThemeToggle,
} from '@/components';
import { WASH_PHASES } from '@/lib/phases';
import { spacing } from '@/theme/tokens';
import { useTheme } from '@/theme';

const ALL_ICONS = Object.keys(ICON_MAP) as AppIconName[];

export default function StyleGuideScreen() {
  const { colors, spacing: sp } = useTheme();
  const [inputText, setInputText] = useState('Texto de ejemplo');
  const [errorInputText, setErrorInputText] = useState('Placa inválida');

  return (
    <ScreenContainer scroll contentContainerStyle={styles.container}>
      {/* Top Bar */}
      <View style={styles.header}>
        <Button
          title="Volver"
          variant="ghost"
          size="sm"
          leftIcon="ChevronRight"
          onPress={() => router.back()}
          style={styles.backButton}
        />
        <ThemeToggle showLabel={false} />
      </View>

      <AppText variant="display" style={styles.pageTitle}>
        Guía de Estilos
      </AppText>
      <AppText variant="body" muted style={styles.pageSubtitle}>
        Catálogo visual de tokens, componentes base e iconografía de AutoClean AI.
      </AppText>

      {/* 1. Logos */}
      <Card style={styles.sectionCard}>
        <AppText variant="title" style={styles.sectionTitle}>
          Logotipo
        </AppText>
        <View style={styles.row}>
          <View style={styles.logoItem}>
            <AppText variant="caption" muted style={styles.itemLabel}>
              Variante Completa (Full)
            </AppText>
            <Logo size={48} variant="full" />
          </View>
          <View style={styles.logoItem}>
            <AppText variant="caption" muted style={styles.itemLabel}>
              Símbolo (Mark)
            </AppText>
            <Logo size={44} variant="mark" />
          </View>
        </View>
      </Card>

      {/* 2. Fases de Lavado */}
      <Card style={styles.sectionCard}>
        <AppText variant="title" style={styles.sectionTitle}>
          Fases del Lavado (Fuente Única)
        </AppText>
        <AppText variant="caption" muted style={styles.itemLabel}>
          Badge por fase con etiqueta oficial e icono Lucide asociado
        </AppText>
        <View style={styles.badgesWrapper}>
          {WASH_PHASES.map((phase) => (
            <Badge
              key={phase.code}
              variant="phase"
              phase={phase.code}
              label={`${phase.label} (${phase.percent}%)`}
            />
          ))}
        </View>
      </Card>

      {/* 3. Botones y Estados */}
      <Card style={styles.sectionCard}>
        <AppText variant="title" style={styles.sectionTitle}>
          Botones y Estados
        </AppText>
        <View style={styles.columnGap}>
          <Button
            title="Botón Primario"
            variant="primary"
            leftIcon="Check"
            onPress={() => {}}
          />
          <Button
            title="Botón Secundario"
            variant="secondary"
            leftIcon="RefreshCw"
            onPress={() => {}}
          />
          <Button
            title="Botón Ghost"
            variant="ghost"
            rightIcon="ChevronRight"
            onPress={() => {}}
          />
          <Button
            title="Cargando..."
            variant="primary"
            loading
            onPress={() => {}}
          />
          <Button
            title="Deshabilitado"
            variant="primary"
            disabled
            onPress={() => {}}
          />
        </View>
      </Card>

      {/* 4. Campos de Texto */}
      <Card style={styles.sectionCard}>
        <AppText variant="title" style={styles.sectionTitle}>
          Campos de Texto (TextField)
        </AppText>
        <TextField
          label="Placa del Vehículo"
          placeholder="Ej: ABC-123"
          value={inputText}
          onChangeText={setInputText}
          helperText="Ingresa las 3 letras y 3 números"
          rightIcon="Search"
          showCounter
          maxLength={7}
        />
        <TextField
          label="Campo con Error"
          value={errorInputText}
          onChangeText={setErrorInputText}
          errorText="El formato de placa no coincide con el estándar"
          rightIcon="WifiOff"
        />
      </Card>

      {/* 5. Tarjetas (Cards) */}
      <Card style={styles.sectionCard}>
        <AppText variant="title" style={styles.sectionTitle}>
          Variantes de Tarjetas
        </AppText>
        <View style={styles.columnGap}>
          <Card variant="elevated">
            <AppText variant="subtitle">Tarjeta Elevada (Elevated)</AppText>
            <AppText variant="body" muted>
              Superficie con sombra suave para jerarquía principal.
            </AppText>
          </Card>
          <Card variant="outlined">
            <AppText variant="subtitle">Tarjeta con Borde (Outlined)</AppText>
            <AppText variant="body" muted>
              Borde sutil para agrupaciones secundarias.
            </AppText>
          </Card>
          <Card variant="flat">
            <AppText variant="subtitle">Tarjeta Plana (Flat)</AppText>
            <AppText variant="body" muted>
              Fondo alternativo para secciones de apoyo.
            </AppText>
          </Card>
        </View>
      </Card>

      {/* 6. Catálogo de Iconos */}
      <Card style={styles.sectionCard}>
        <AppText variant="title" style={styles.sectionTitle}>
          Set de Iconos ({ALL_ICONS.length})
        </AppText>
        <View style={styles.iconGrid}>
          {ALL_ICONS.map((iconName) => (
            <View
              key={iconName}
              style={[styles.iconCard, { backgroundColor: colors.surfaceAlt }]}
            >
              <Icon name={iconName} size={22} color={colors.primary} />
              <AppText variant="caption" style={styles.iconNameText} numberOfLines={1}>
                {iconName}
              </AppText>
            </View>
          ))}
        </View>
      </Card>

      {/* 7. Selector de Tema */}
      <Card style={[styles.sectionCard, { marginBottom: sp[32] }]}>
        <AppText variant="title" style={styles.sectionTitle}>
          Modo de Color
        </AppText>
        <AppText variant="body" muted style={styles.itemLabel}>
          Alternar entre modo claro y oscuro. La preferencia persiste en el dispositivo.
        </AppText>
        <View style={styles.toggleWrapper}>
          <ThemeToggle />
        </View>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing[32],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[16],
  },
  backButton: {
    minWidth: 80,
    transform: [{ scaleX: -1 }],
  },
  pageTitle: {
    marginBottom: 6,
  },
  pageSubtitle: {
    marginBottom: spacing[20],
  },
  sectionCard: {
    marginBottom: spacing[16],
  },
  sectionTitle: {
    marginBottom: spacing[12],
  },
  itemLabel: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[16],
    alignItems: 'center',
  },
  logoItem: {
    gap: 6,
  },
  badgesWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[8],
    marginTop: 4,
  },
  columnGap: {
    gap: spacing[12],
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  iconCard: {
    width: '30%',
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: spacing[12],
    paddingHorizontal: 4,
    borderRadius: 8,
    gap: 6,
  },
  iconNameText: {
    fontSize: 11,
    textAlign: 'center',
  },
  toggleWrapper: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
});
