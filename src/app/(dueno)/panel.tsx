import React from 'react';
import { StyleSheet } from 'react-native';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { ScreenContainer } from '@/components/ScreenContainer';
import { spacing } from '@/theme/tokens';

export default function PanelScreen() {
  return (
    <ScreenContainer contentContainerStyle={styles.container}>
      <Card variant="elevated" style={styles.card}>
        <AppText variant="title" style={styles.title}>
          Panel
        </AppText>
        <AppText variant="body" color="textMuted" style={styles.description}>
          Disponible en una próxima fase
        </AppText>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    padding: spacing[16],
  },
  card: {
    alignItems: 'center',
    paddingVertical: spacing[32],
    paddingHorizontal: spacing[16],
  },
  title: {
    marginBottom: spacing[8],
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
  },
});
