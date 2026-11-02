import Constants from 'expo-constants';

export interface AppConfig {
  apiUrl: string;
}

const envApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const extraApiUrl =
  typeof Constants.expoConfig?.extra?.apiUrl === 'string'
    ? Constants.expoConfig.extra.apiUrl.trim()
    : undefined;

const resolvedApiUrl = envApiUrl && envApiUrl.length > 0 ? envApiUrl : extraApiUrl;

if (!resolvedApiUrl || resolvedApiUrl.length === 0) {
  throw new Error(
    'No se pudo resolver la URL del backend. Define EXPO_PUBLIC_API_URL en el entorno o configura extra.apiUrl en app.json.',
  );
}

export const config: AppConfig = {
  apiUrl: resolvedApiUrl.replace(/\/+$/, ''),
};
