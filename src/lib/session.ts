import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'autoclean.token';

/**
 * Persists the user's authentication JWT in secure storage.
 * Note: Never store passwords and never log token contents.
 */
export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

/**
 * Retrieves the stored JWT token from secure storage.
 */
export async function getToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(TOKEN_KEY);
}

/**
 * Removes the stored JWT token from secure storage on logout or session expiration.
 */
export async function deleteToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
