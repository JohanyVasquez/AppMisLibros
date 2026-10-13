import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database.types';

/**
 * Cliente único de Supabase para toda la aplicación.
 *
 * Reglas de este módulo:
 * - Nunca se crea un segundo cliente: este módulo es la única fuente.
 * - La sesión se persiste en AsyncStorage (obligatorio en nativo);
 *   sin `storage`, `persistSession` no funciona y la sesión muere en cada reinicio.
 * - `detectSessionInUrl: false` porque en React Native no hay barra de direcciones
 *   con el token de confirmación.
 * - Las claves `EXPO_PUBLIC_*` van en claro dentro del bundle: eso es intencional
 *   en una app móvil y NO son secretos. La seguridad la dan RLS y Postgres.
 */

/** Error de configuración: faltan variables de entorno o son inválidas. */
export class SupabaseConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseConfigError';
  }
}

const NOMBRE_VARIABLE_URL = 'EXPO_PUBLIC_SUPABASE_URL';
const NOMBRE_VARIABLE_CLAVE = 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY';

/**
 * El proyecto previo usaba el nombre legacy de la clave pública. Se acepta
 * como alternativa para no romper una configuración existente, pero la
 * variable oficial para esta tarea es `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
 */
function leerClavePublica(): string | undefined {
  const oficial = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (oficial && oficial.trim().length > 0) return oficial.trim();

  const legacy = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (legacy && legacy.trim().length > 0) return legacy.trim();

  return undefined;
}

/**
 * Valida las variables de entorno y devuelve un mensaje comprensible en español
 * en lugar de dejar que `createClient` reviente con un error técnico.
 */
export function validarConfiguracionSupabase(): string | null {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const clave = leerClavePublica();

  const faltantes: string[] = [];
  if (!url) faltantes.push(NOMBRE_VARIABLE_URL);
  if (!clave) faltantes.push(NOMBRE_VARIABLE_CLAVE);

  if (faltantes.length > 0) {
    return (
      `Faltan las variables de entorno ${faltantes.join(' y ')}. ` +
      'Copia .env.example a .env y completa los valores de tu proyecto Supabase ' +
      '(Project Settings → API). Reinicia Expo con "npx expo start -c" después de editarlas.'
    );
  }

  if (!/^https?:\/\/.+/i.test(url as string)) {
    return `${NOMBRE_VARIABLE_URL} no tiene un formato de URL válido. Debe empezar por https://`;
  }

  return null;
}

/**
 * Tipo del cliente. Se deriva de `createClient` para no anotar a mano
 * un `SupabaseClient<Database>`: las versiones recientes de supabase-js
 * resuelven los genéricos de forma diferida y una anotación manual rompe el build.
 */
export type ClienteSupabase = ReturnType<typeof createClient<Database>>;

let cliente: ClienteSupabase | null = null;
// `undefined` = aún no se intentó inicializar; `null` = inicializado sin error.
let errorConfig: string | null | undefined = undefined;

function inicializar(): void {
  if (cliente !== null || errorConfig !== undefined) return;

  const problema = validarConfiguracionSupabase();
  if (problema) {
    // No se lanza aquí: la UI necesita mostrar el mensaje, no un crash al importar.
    errorConfig = problema;
    return;
  }

  try {
    cliente = createClient<Database>(
      process.env.EXPO_PUBLIC_SUPABASE_URL as string,
      leerClavePublica() as string,
      {
        auth: {
          storage: AsyncStorage,
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      },
    );
    errorConfig = null;
  } catch (error) {
    errorConfig =
      error instanceof Error
        ? error.message
        : 'No se pudo crear el cliente de Supabase.';
  }
}

/**
 * Devuelve el cliente único. Lanza `SupabaseConfigError` con un mensaje
 * legible si la configuración de `.env` está incompleta.
 */
export function obtenerSupabase(): ClienteSupabase {
  inicializar();
  if (cliente === null) {
    throw new SupabaseConfigError(
      errorConfig ?? 'Supabase no está configurado.',
    );
  }
  return cliente;
}

/**
 * `true` cuando el cliente puede usarse. Permite pintar una pantalla de error
 * de configuración en lugar de dejar la app en blanco.
 */
export function supabaseDisponible(): boolean {
  inicializar();
  return cliente !== null;
}

/** Mensaje de error de configuración, o `null` si todo está bien. */
export function obtenerErrorConfigSupabase(): string | null {
  inicializar();
  // `undefined` solo sería posible si `inicializar` no llegara a asignar,
  // lo cual no ocurre: siempre deja el valor en `string` o `null`.
  return errorConfig ?? null;
}