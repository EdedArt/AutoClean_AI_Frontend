import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { formatPlateInput, isValidPlate } from '@/lib/plate';
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
  const { t } = useTranslation();
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
      setValidationError(t('client.invalidPlate'));
      return;
    }

    setValidationError(null);
    onSearch(formatted);
  };

  const displayedError = validationError || externalError;

  return (
    <View style={styles.container}>
      <TextField
        label={t('client.plateLabel')}
        placeholder={t('client.platePlaceholder')}
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
        accessibilityLabel={t('client.plateLabel')}
      />

      <Button
        title={t('common.search')}
        leftIcon="Search"
        onPress={handleSubmit}
        loading={loading}
        disabled={loading}
        style={styles.searchButton}
        accessibilityLabel={t('common.search')}
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
