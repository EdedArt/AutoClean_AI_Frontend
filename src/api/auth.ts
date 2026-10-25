import { apiClient } from './client';

export type UserRole = 'CLIENTE' | 'OPERARIO';

export interface AuthUser {
  id: number;
  nombre: string;
  email: string;
  rol: UserRole;
  createdAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface RegisterRequest {
  nombre: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  user: AuthUser;
}

export interface AuthMeResponse {
  user?: AuthUser;
  id?: number;
  nombre?: string;
  email?: string;
  rol?: UserRole;
  createdAt?: string;
}

/**
 * Inicia sesión con credenciales y devuelve el token JWT y los datos del usuario.
 */
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  return await apiClient.post<LoginResponse>('/api/auth/login', credentials);
}

/**
 * Registra un nuevo usuario cliente. No incluye 'rol' ya que el backend asigna 'CLIENTE'.
 * Nota: El endpoint de registro del backend no retorna token; se debe llamar a login inmediatamente.
 */
export async function register(data: RegisterRequest): Promise<RegisterResponse> {
  const { nombre, email, password } = data;
  return await apiClient.post<RegisterResponse>('/api/auth/register', {
    nombre,
    email,
    password,
  });
}

/**
 * Obtiene los datos del usuario autenticado actual mediante el token JWT.
 */
export async function getMe(token: string): Promise<AuthUser> {
  const response = await apiClient.get<AuthMeResponse>('/api/auth/me', { token });

  if (response.user) {
    return response.user;
  }

  return {
    id: response.id as number,
    nombre: response.nombre as string,
    email: response.email as string,
    rol: response.rol as UserRole,
    createdAt: response.createdAt,
  };
}
