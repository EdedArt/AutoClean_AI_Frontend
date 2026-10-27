import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { formatPlateInput, INVALID_PLATE_MESSAGE, isValidPlate } from '@/lib/plate';
import { spacing } from '@/theme/tokens';

export interface PlateSearchFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  onSearch: (plate: string) => void;
  loading?: boolean;
  externalError?: string;
  onClearError?: () => void;
}

export function PlateSearchField({
  value,
  onChangeText,
  onSearch,
  loading = false,
  externalError,
  onClearError,
}: PlateSearchFieldProps) {
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleChangeText = (raw: string) => {
    if (validationError) {
      setValidationError(null);
    }
    if (onClearError) {
      onClearError();
    }
    const formatted = formatPlateInput(raw);
    onChangeText(formatted);
  };

  const handleSubmit = () => {
    const formatted = formatPlateInput(value);
    if (!isValidPlate(formatted)) {
      setValidationError(INVALID_PLATE_MESSAGE);
      return;
    }

    setValidationError(null);
    onSearch(formatted);
  };

  const displayedError = validationError || externalError;

  return (
    <View style={styles.container}>
      <TextField
        label="Placa del vehículo"
        placeholder="ABC-123"
        value={value}
        onChangeText={handleChangeText}
        maxLength={7}
        autoCapitalize="characters"
        autoCorrect={false}
        returnKeyType="search"
        onSubmitEditing={handleSubmit}
        errorText={displayedError}
        rightIcon={value.length > 0 ? 'X' : undefined}
        onRightIconPress={
          value.length > 0
            ? () => {
                onChangeText('');
                setValidationError(null);
                if (onClearError) {
                  onClearError();
                }
              }
            : undefined
        }
        accessibilityLabel="Campo de placa del vehículo"
        accessibilityHint="Ingresa los tres caracteres y tres dígitos de la placa"
      />

      <Button
        title="Buscar"
        leftIcon="Search"
        onPress={handleSubmit}
        loading={loading}
        disabled={loading}
        style={styles.searchButton}
        accessibilityLabel="Buscar placa"
        accessibilityHint="Inicia la consulta del estado de lavado para la placa ingresada"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: spacing[16],
  },
  searchButton: {
    marginTop: 2,
    minHeight: 48,
  },
});
