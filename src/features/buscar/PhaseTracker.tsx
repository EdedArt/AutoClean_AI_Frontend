import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Icon } from '@/components/Icon';
import { getPhaseIndex, WASH_PHASES } from '@/lib/phases';
import { useTheme } from '@/theme';
import { WashPhaseCode } from '@/theme/tokens';

export interface PhaseTrackerProps {
  currentPhase: WashPhaseCode;
}

export function PhaseTracker({ currentPhase }: PhaseTrackerProps) {
  const { colors, phaseColors } = useTheme();
  const currentIndex = getPhaseIndex(currentPhase);

  return (
    <View style={styles.container}>
      <View style={styles.stepsRow}>
        {WASH_PHASES.map((phase, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isUpcoming = index > currentIndex;
          const isLast = index === WASH_PHASES.length - 1;

          const stepColor = phaseColors[phase.code].main;

          const nodeBg = isCompleted
            ? colors.accent
            : isCurrent
              ? phaseColors[phase.code].bg
              : colors.surfaceAlt;

          const nodeBorder = isCompleted ? colors.accent : isCurrent ? stepColor : colors.border;

          const nodeContentColor = isCompleted
            ? colors.onPrimary
            : isCurrent
              ? stepColor
              : colors.disabledText;

          const statusLabel = isCurrent ? 'fase actual' : isCompleted ? 'completado' : 'pendiente';

          return (
            <React.Fragment key={phase.code}>
              <View
                style={styles.stepColumn}
                accessible
                accessibilityLabel={`${phase.label}, ${statusLabel}`}
              >
                <View
                  style={[
                    styles.node,
                    {
                      backgroundColor: nodeBg,
                      borderColor: nodeBorder,
                    },
                    isCurrent && styles.nodeCurrent,
                  ]}
                >
                  {isCompleted ? (
                    <Icon name="Check" size={14} color={nodeContentColor} strokeWidth={2.5} />
                  ) : (
                    <Icon
                      name={phase.icon}
                      size={14}
                      color={nodeContentColor}
                      strokeWidth={isCurrent ? 2.5 : 2}
                    />
                  )}
                </View>

                <View style={styles.labelContainer}>
                  <AppText
                    variant="caption"
                    style={[
                      styles.labelText,
                      {
                        color: isUpcoming ? colors.textMuted : colors.text,
                        fontWeight: isCurrent ? '700' : isCompleted ? '600' : '400',
                      },
                    ]}
                  >
                    {phase.label}
                  </AppText>
                </View>
              </View>

              {!isLast && (
                <View style={styles.connectorWrapper}>
                  <View
                    style={[
                      styles.connectorLine,
                      {
                        backgroundColor: index < currentIndex ? colors.accent : colors.border,
                      },
                    ]}
                  />
                </View>
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 8,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
  },
  stepColumn: {
    flex: 1,
    alignItems: 'center',
  },
  node: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  nodeCurrent: {
    borderWidth: 2,
    transform: [{ scale: 1.08 }],
  },
  connectorWrapper: {
    width: 12,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectorLine: {
    width: '100%',
    height: 2,
  },
  labelContainer: {
    marginTop: 6,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 1,
  },
  labelText: {
    fontSize: 10,
    lineHeight: 13,
    textAlign: 'center',
  },
});
