import type { Session, User } from '@supabase/supabase-js';

import { obtenerSupabase, SupabaseConfigError } from '@/lib/supabase';
import { traducirErrorAuth } from '@/lib/errores';
import {
  normalizarTexto,
  validarEmail,
  validarPassword,
} from '@/lib/validacion';

/**
 * Error de autenticación con mensaje apto para mostrar al usuario.
 */
export class AuthServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthServiceError';
  }
}

/** Estado de una sesión, en el formato que consume el contexto de React. */
export type EstadoSesion = 'SIGNED_OUT' | 'SIGNED_IN' | 'PENDING';

/** Resultado de un registro. `sesionActiva` es `false` si Supabase exige confirmar el correo. */
export type ResultadoRegistro = {
  sesionActiva: boolean;
  mensaje: string;
  requiereConfirmacionCorreo: boolean;
};

/**
 * Eventos de Supabase Auth.
 * Se declara fuera de la clase para que TypeScript pueda inferir el tipo.
 */
export type CambioSesion = {
  evento: EstadoSesion | 'TOKEN_REFRESHED' | 'USER_UPDATED' | string;
  sesion: Session | null;
};

/**
 * Fachada única de `supabase.auth`.
 *
 * Ninguna pantalla llama a `supabase.auth.*` directamente: todas pasan por acá,
 * de modo que la validación y la traducción de errores estén en un solo lugar.
 */
export class AuthService {
  /** Registra un usuario nuevo con correo y contraseña. */
  public static async registrar(
    email: string,
    password: string,
  ): Promise<ResultadoRegistro> {
    const correo = normalizarTexto(email).toLowerCase();

    const errorEmail = validarEmail(correo);
    if (errorEmail) throw new AuthServiceError(errorEmail);

    const errorPassword = validarPassword(password);
    if (errorPassword) throw new AuthServiceError(errorPassword);

    const { data, error } = await obtenerSupabase().auth.signUp({
      email: correo,
      password,
    });

    if (error) {
      throw new AuthServiceError(traducirErrorAuth(error));
    }

    const requiereConfirmacion =
      data.user !== null &&
      data.user.email_confirmed_at === undefined &&
      data.session === null;

    if (data.session !== null) {
      return {
        sesionActiva: true,
        mensaje: 'Cuenta creada. Ingresando…',
        requiereConfirmacionCorreo: false,
      };
    }

    return {
      sesionActiva: false,
      mensaje: requiereConfirmacion
        ? 'Cuenta creada. Revisa tu correo y confirma el enlace para poder iniciar sesión.'
        : 'Cuenta creada. Ya puedes iniciar sesión.',
      requiereConfirmacionCorreo: requiereConfirmacion,
    };
  }

  /** Inicia sesión con correo y contraseña. */
  public static async iniciarSesion(
    email: string,
    password: string,
  ): Promise<User> {
    const correo = normalizarTexto(email).toLowerCase();

    const errorEmail = validarEmail(correo);
    if (errorEmail) throw new AuthServiceError(errorEmail);

    if (normalizarTexto(password).length === 0) {
      throw new AuthServiceError('La contraseña es obligatoria.');
    }

    const { data, error } = await obtenerSupabase().auth.signInWithPassword({
      email: correo,
      password,
    });

    if (error) {
      throw new AuthServiceError(traducirErrorAuth(error));
    }

    if (data.user === null) {
      throw new AuthServiceError('No se pudo iniciar sesión. Intenta nuevamente.');
    }

    return data.user;
  }

  /**
   * Cierra la sesión.
   *
   * `signOut` propaga el cambio al `onAuthStateChange`, así que el contexto
   * actualiza el estado global y la navegación vuelve al flujo público sin
   * ninguna redirección manual.
   */
  public static async cerrarSesion(): Promise<void> {
    const { error } = await obtenerSupabase().auth.signOut();
    if (error) {
      throw new AuthServiceError(traducirErrorAuth(error));
    }
  }

  /** Devuelve la sesión guardada localmente (AsyncStorage), o `null`. */
  public static async obtenerSesion(): Promise<Session | null> {
    const { data, error } = await obtenerSupabase().auth.getSession();
    if (error) {
      throw new AuthServiceError(traducirErrorAuth(error));
    }
    return data.session;
  }

  /** Devuelve solo el usuario de la sesión actual, o `null`. */
  public static async obtenerUsuario(): Promise<User | null> {
    const sesion = await AuthService.obtenerSesion();
    return sesion?.user ?? null;
  }

  /**
   * Se suscribe a los cambios de sesión.
   *
   * IMPORTANTE: el callback NO debe hacer `await` — supabase-js puede entrar en
   * deadlock. Quien necesite reaccionar con lógica asíncrona debe lanzar la
   * operación fuera del callback.
   *
   * Devuelve la función de unsubscribe para limpiar el listener.
   */
  public static escucharCambiosSesion(
    callback: (cambio: CambioSesion) => void,
  ): () => void {
    const { data } = obtenerSupabase().auth.onAuthStateChange(
      (evento, sesion) => {
        callback({ evento, sesion });
      },
    );

    return () => {
      data.subscription.unsubscribe();
    };
  }
}

export { SupabaseConfigError };