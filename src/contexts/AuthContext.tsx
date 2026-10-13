import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type { Session, User } from '@supabase/supabase-js';

import {
  AuthService,
  AuthServiceError,
  type CambioSesion,
  type ResultadoRegistro,
} from '@/services/AuthService';
import {
  obtenerErrorConfigSupabase,
  supabaseDisponible,
} from '@/lib/supabase';

/**
 * Estado global de autenticación.
 *
 * Es la única fuente de verdad de la que depende la navegación: Expo Router
 * protege el grupo `(app)` o `(auth)` según `isAuthenticated`. No existe ninguna
 * redirección manual a Home después del login.
 */
export type AuthContextValue = {
  /** `true` mientras se restaura la sesión al abrir la app. */
  isLoading: boolean;
  /** `true` cuando Supabase confirmó una sesión válida. */
  isAuthenticated: boolean;
  user: User | null;
  session: Session | null;
  /** Mensaje de error si `.env` está incompleto; `null` si la configuración está bien. */
  errorConfig: string | null;
  registrar: (email: string, password: string) => Promise<ResultadoRegistro>;
  iniciarSesion: (email: string, password: string) => Promise<User>;
  cerrarSesion: () => Promise<void>;
  /** Vuelve a leer la sesión desde el almacenamiento local. */
  refrescarSesion: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Prueba de la Singleton del repositorio, conservada de la tarea anterior.
 * Se ejecuta una sola vez al cargar el módulo, igual que entonces.
 */
if (__DEV__) {
  // Import diferido para no crear un ciclo con el repositorio en tiempo de carga.
  void import('@/repositories/LibroRepository').then(({ LibroRepository }) => {
    const repository1 = LibroRepository.getInstance();
    const repository2 = LibroRepository.getInstance();
    console.log(
      '¿Repository 1 y Repository 2 son la misma instancia?',
      repository1 === repository2,
    );
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // `errorConfig` se calcula una sola vez y de forma síncrona: si falta el
  // `.env` no hay sesión que restaurar, y la app debe mostrar el mensaje en
  // vez de quedarse en blanco. No lleva setter porque no cambia en runtime.
  const [errorConfig] = useState<string | null>(() =>
    obtenerErrorConfigSupabase(),
  );

  // Arranca en `supabaseDisponible()`, no en `true`: ponerlo en `true` desde el
  // estado inicial provocaría un render en cascada innecesario.
  const [isLoading, setIsLoading] = useState<boolean>(() => !supabaseDisponible());

  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // `onAuthStateChange` no debe hacer `await`; se usa este ref para leer el
  // estado más reciente sin depender del closure.
  const montado = useRef(true);

  useEffect(() => {
    montado.current = true;

    if (!supabaseDisponible()) {
      setIsLoading(false);
      return () => {
        montado.current = false;
      };
    }

    let unsubscribe: (() => void) | null = null;
    let cancelado = false;

    // 1) Restaurar la sesión guardada en AsyncStorage.
    //    No se asume que esté restaurada: hasta que esto resuelva, `isLoading`
    //    sigue en `true` y la navegación muestra la pantalla de carga.
    (async () => {
      try {
        const sesion = await AuthService.obtenerSesion();
        if (cancelado || !montado.current) return;
        setSession(sesion);
        setUser(sesion?.user ?? null);
      } catch (error) {
        if (!cancelado && montado.current) {
          console.warn('[AuthProvider] No se pudo restaurar la sesión', error);
        }
      } finally {
        if (!cancelado && montado.current) {
          setIsLoading(false);
        }
      }
    })();

    // 2) Un ÚNICO listener para toda la aplicación. Cubre también
    //    `TOKEN_REFRESHED`, que es el mecanismo de refresco de token
    //    (`autoRefreshToken`). Se limpia al desmontar para no acumular
    //    suscripciones.
    try {
      unsubscribe = AuthService.escucharCambiosSesion((cambio: CambioSesion) => {
        if (!montado.current) return;
        setSession(cambio.sesion);
        setUser(cambio.sesion?.user ?? null);
        setIsLoading(false);
      });
    } catch (error) {
      if (__DEV__) {
        console.warn('[AuthProvider] No se pudo registrar onAuthStateChange', error);
      }
    }

    return () => {
      cancelado = true;
      montado.current = false;
      unsubscribe?.();
    };
  }, []);

  const registrar = useCallback(
    async (email: string, password: string): Promise<ResultadoRegistro> => {
      try {
        return await AuthService.registrar(email, password);
      } catch (error) {
        throw new AuthServiceError(
          error instanceof Error ? error.message : 'No se pudo crear la cuenta.',
        );
      }
    },
    [],
  );

  const iniciarSesion = useCallback(
    async (email: string, password: string): Promise<User> => {
      try {
        return await AuthService.iniciarSesion(email, password);
      } catch (error) {
        throw new AuthServiceError(
          error instanceof Error ? error.message : 'No se pudo iniciar sesión.',
        );
      }
    },
    [],
  );

  const cerrarSesion = useCallback(async (): Promise<void> => {
    try {
      await AuthService.cerrarSesion();
      // Doble garantia: signOut ya dispara SIGNED_OUT, pero si ese evento se
      // perdiera, el estado local se limpia igual y el guard de sesion
      // habilita el grupo publico.
      if (montado.current) {
        setSession(null);
        setUser(null);
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[AuthProvider] Error al cerrar sesión', error);
      }
      throw new AuthServiceError(
        error instanceof Error ? error.message : 'No se pudo cerrar la sesión.',
      );
    }
  }, []);

  const refrescarSesion = useCallback(async (): Promise<void> => {
    try {
      const sesion = await AuthService.obtenerSesion();
      if (!montado.current) return;
      setSession(sesion);
      setUser(sesion?.user ?? null);
    } catch (error) {
      if (__DEV__) {
        console.warn('[AuthProvider] Error al refrescar la sesión', error);
      }
    }
  }, []);

  const valor = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      isAuthenticated: session !== null,
      user,
      session,
      errorConfig,
      registrar,
      iniciarSesion,
      cerrarSesion,
      refrescarSesion,
    }),
    [
      isLoading,
      session,
      user,
      errorConfig,
      registrar,
      iniciarSesion,
      cerrarSesion,
      refrescarSesion,
    ],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

/** Acceso al estado de autenticación. Lanza si se usa fuera del `AuthProvider`. */
export function useAuthContext(): AuthContextValue {
  const contexto = useContext(AuthContext);
  if (contexto === null) {
    throw new Error('useAuthContext debe usarse dentro de <AuthProvider>.');
  }
  return contexto;
}