import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { WASH_PHASES } from '@/lib/phases';
import { useTheme } from '@/theme';
import { radius, spacing, WashPhaseCode } from '@/theme/tokens';

export interface ManualPhaseControlProps {
  currentPhase: WashPhaseCode;
  disabled?: boolean;
  loadingPhase?: WashPhaseCode | null;
  onSelectPhase: (phase: WashPhaseCode) => void;
}

export function ManualPhaseControl({
  currentPhase,
  disabled = false,
  loadingPhase = null,
  onSelectPhase,
}: ManualPhaseControlProps) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);

  return (
    <Card
      variant="outlined"
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceDimmed,
          borderColor: colors.border,
        },
      ]}
    >
      <Pressable
        onPress={() => setExpanded((prev) => !prev)}
        accessible
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel="Control manual de fases, sección de respaldo"
        accessibilityHint={
          expanded
            ? 'Toca para ocultar los botones manuales de fase'
            : 'Toca para desplegar los botones manuales de fase'
        }
        style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.headerIconPill, { backgroundColor: colors.surfaceAlt }]}>
            <Icon name="SlidersHorizontal" size={16} color={colors.textMuted} />
          </View>
          <View style={styles.headerTextCol}>
            <AppText variant="body" weight="medium" color="textMuted">
              Control manual
            </AppText>
            <AppText variant="caption" muted>
              Respaldo manual en caso de contingencia con la IA
            </AppText>
          </View>
        </View>

        <Icon name={expanded ? 'ChevronUp' : 'ChevronDown'} size={20} color={colors.textMuted} />
      </Pressable>

      {expanded ? (
        <View style={[styles.body, { borderTopColor: colors.border }]}>
          <AppText variant="caption" muted style={styles.helperText}>
            Selecciona una fase para actualizar manualmente la orden:
          </AppText>

          <View style={styles.phaseButtonsList}>
            {WASH_PHASES.map((phase) => {
              const isCurrent = phase.code === currentPhase;
              const isPhaseLoading = loadingPhase === phase.code;

              return (
                <Button
                  key={phase.code}
                  title={isCurrent ? `${phase.label} (Actual)` : phase.label}
                  variant="secondary"
                  size="sm"
                  leftIcon={phase.icon}
                  disabled={disabled || isCurrent || Boolean(loadingPhase)}
                  loading={isPhaseLoading}
                  onPress={() => onSelectPhase(phase.code)}
                  style={styles.phaseButton}
                  accessibilityLabel={`Cambiar manualmente a fase ${phase.label}`}
                />
              );
            })}
          </View>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
    marginBottom: spacing[16],
  },
  headerButton: {
    minHeight: 56,
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[12],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pressed: {
    opacity: 0.75,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing[8],
  },
  headerIconPill: {
    width: 32,
    height: 32,
    borderRadius: radius[8],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[12],
  },
  headerTextCol: {
    flex: 1,
  },
  body: {
    borderTopWidth: 1,
    padding: spacing[16],
  },
  helperText: {
    marginBottom: spacing[12],
  },
  phaseButtonsList: {
    gap: spacing[8],
  },
  phaseButton: {
    justifyContent: 'flex-start',
  },
});
