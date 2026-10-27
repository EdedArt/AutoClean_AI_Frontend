import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PlateSearchField } from '@/features/buscar/PlateSearchField';
import { AppText } from '@/components/AppText';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useAuth } from '@/features/auth';
import { spacing } from '@/theme/tokens';

export default function BuscarScreen() {
  const { user } = useAuth();
  const [inputText, setInputText] = useState('');
  const [searchedPlate, setSearchedPlate] = useState('');

  const greetingName = user?.nombre ? user.nombre.split(' ')[0] : 'Cliente';

  const handleSearch = (plate: string) => {
    setSearchedPlate(plate);
  };

  return (
    <ScreenContainer scroll contentContainerStyle={styles.container}>
      {/* Header Greeting */}
      <View style={styles.header}>
        <AppText variant="title" weight="bold" style={styles.greetingTitle}>
          Hola, {greetingName}
        </AppText>
        <AppText variant="body" muted style={styles.subtitle}>
          Consulta el estado de tu vehículo en tiempo real
        </AppText>
      </View>

      {/* Search Input Field */}
      <PlateSearchField
        value={inputText}
        onChangeText={setInputText}
        onSearch={handleSearch}
      />

      {/* Main State Area */}
      {!searchedPlate && (
        <View style={styles.initialContainer}>
          <AppText variant="caption" muted style={styles.initialHelperText}>
            Ingresa la placa de tu vehículo para consultar su avance en el lavado.
          </AppText>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing[16],
    paddingBottom: spacing[32],
  },
  header: {
    marginTop: spacing[8],
    marginBottom: spacing[20],
  },
  greetingTitle: {
    fontSize: 26,
    lineHeight: 32,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  initialContainer: {
    paddingVertical: spacing[24],
    alignItems: 'center',
  },
  initialHelperText: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
  },
});
