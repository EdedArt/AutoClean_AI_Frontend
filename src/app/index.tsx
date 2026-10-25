import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, View } from 'react-native';

import { ApiError } from '@/api/client';
import { getHealth } from '@/api/health';

type ConnectionStatus = 'loading' | 'success' | 'error';

export default function HomeScreen() {
  const [status, setStatus] = useState<ConnectionStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resolveErrorMessage = (error: unknown): string => {
    if (error instanceof ApiError) {
      return error.message;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'Ocurrió un error inesperado';
  };

  const handleRetry = useCallback(async () => {
    setStatus('loading');
    setErrorMessage(null);
    try {
      await getHealth();
      setStatus('success');
    } catch (error: unknown) {
      setStatus('error');
      setErrorMessage(resolveErrorMessage(error));
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    getHealth()
      .then(() => {
        if (isMounted) {
          setStatus('success');
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setStatus('error');
          setErrorMessage(resolveErrorMessage(error));
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.appTitle}>AutoClean AI</Text>

      {status === 'loading' && (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.statusText}>Verificando conexión con el servidor...</Text>
        </View>
      )}

      {status === 'success' && (
        <View style={styles.stateContainer}>
          <Text style={[styles.statusText, styles.successText]}>Servidor conectado</Text>
        </View>
      )}

      {status === 'error' && (
        <View style={styles.stateContainer}>
          <Text style={[styles.statusText, styles.errorText]}>Sin conexión con el servidor</Text>
          {errorMessage ? <Text style={styles.errorDetail}>{errorMessage}</Text> : null}
          <View style={styles.buttonWrapper}>
            <Button title="Reintentar" onPress={handleRetry} color="#0066cc" />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 32,
    color: '#111111',
  },
  stateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 18,
    marginTop: 12,
    textAlign: 'center',
    color: '#333333',
  },
  successText: {
    color: '#2e7d32',
    fontWeight: '600',
  },
  errorText: {
    color: '#c62828',
    fontWeight: '600',
  },
  errorDetail: {
    fontSize: 14,
    color: '#666666',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  buttonWrapper: {
    marginTop: 20,
    minWidth: 140,
  },
});
