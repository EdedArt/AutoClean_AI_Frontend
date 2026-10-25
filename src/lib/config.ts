export interface AppConfig {
  apiUrl: string;
}

const rawApiUrl = process.env.EXPO_PUBLIC_API_URL;

if (!rawApiUrl || rawApiUrl.trim() === '') {
  throw new Error(
    'Falta la variable de entorno EXPO_PUBLIC_API_URL. Configura tu IP local en el archivo .env basándote en .env.example (ejemplo: http://192.168.X.X:3000).'
  );
}

export const config: AppConfig = {
  apiUrl: rawApiUrl.trim().replace(/\/+$/, ''),
};
