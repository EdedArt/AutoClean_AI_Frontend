import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  AuthUser,
  getMe,
  login,
  LoginRequest,
  register,
  RegisterRequest,
  UserRole,
} from '@/api/auth';
import { ApiError, setUnauthorizedHandler } from '@/api/client';
import { deleteToken, getToken, saveToken } from '@/lib/session';

export type AuthState = 'loading' | 'authenticated' | 'unauthenticated' | 'offline';

export interface UserSession {
  id: number;
  nombre: string;
  email: string;
  role: UserRole;
}

export interface AuthContextValue {
  state: AuthState;
  user: UserSession | null;
  signIn: (credentials: LoginRequest) => Promise<void>;
  signUp: (data: RegisterRequest) => Promise<void>;
  signOut: () => Promise<void>;
  retry: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function getRoleLabel(role?: UserRole): string {
  if (role === 'OPERARIO') {
    return 'Dueño';
  }
  return 'Cliente';
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>('loading');
  const [user, setUser] = useState<UserSession | null>(null);

  const checkSession = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        setUser(null);
        setState('unauthenticated');
        return;
      }

      const me: AuthUser = await getMe(token);
      setUser({
        id: me.id,
        nombre: me.nombre,
        email: me.email,
        role: me.rol,
      });
      setState('authenticated');
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === 'NETWORK_ERROR') {
          // Network error: preserve token, set offline state
          setState('offline');
          return;
        }

        if (error.status === 401 || error.code === 'INVALID_CREDENTIALS') {
          // Token expired or invalid: clear session
          await deleteToken().catch(() => {});
          setUser(null);
          setState('unauthenticated');
          return;
        }
      }

      // Any other unexpected network or server issue during startup defaults to offline
      setState('offline');
    }
  }, []);

  useEffect(() => {
    // Register unauthorized handler for authenticated requests
    setUnauthorizedHandler(async () => {
      await deleteToken().catch(() => {});
      setUser(null);
      setState('unauthenticated');
    });

    checkSession();

    return () => {
      setUnauthorizedHandler(null);
    };
  }, [checkSession]);

  const signIn = useCallback(async (credentials: LoginRequest) => {
    const response = await login(credentials);
    await saveToken(response.token);
    setUser({
      id: response.user.id,
      nombre: response.user.nombre,
      email: response.user.email,
      role: response.user.rol,
    });
    setState('authenticated');
  }, []);

  const signUp = useCallback(
    async (data: RegisterRequest) => {
      // 1. Call register
      await register(data);
      // 2. Register returns user but no token; immediately log in
      await signIn({
        email: data.email,
        password: data.password,
      });
    },
    [signIn],
  );

  const signOut = useCallback(async () => {
    await deleteToken().catch(() => {});
    setUser(null);
    setState('unauthenticated');
  }, []);

  const retry = useCallback(async () => {
    setState('loading');
    await checkSession();
  }, [checkSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      state,
      user,
      signIn,
      signUp,
      signOut,
      retry,
    }),
    [state, user, signIn, signUp, signOut, retry],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
