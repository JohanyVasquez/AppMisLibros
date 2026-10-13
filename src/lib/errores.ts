/**
 * Traducción de errores de Supabase / Postgres a mensajes en español.
 *
 * Regla: nunca se muestra el mensaje crudo al usuario. El detalle técnico queda
 * en `detalleTecnico`, que solo se registra en desarrollo.
 */

export type ErrorSupabase = {
  message: string;
  code?: string | null;
  details?: string | null;
  hint?: string | null;
} | null;

export type ErrorTraducido = {
  mensaje: string;
  detalleTecnico?: string;
};

const MENSAJES_POR_CODIGO: Record<string, string> = {
  // 42501 = insufficient_privilege: casi siempre RLS bloqueando la operación.
  '42501':
    'No tienes permisos para realizar esta operación. Verifica que tu sesión esté activa y que las políticas RLS estén aplicadas.',
  // 23514 = check_violation: uno de los CHECK de 001_libros.sql.
  '23514':
    'Los datos no cumplen las validaciones de la base de datos (revisa título, autor y año).',
  // 22P02 = invalid_text_representation: por ejemplo "abc" en una columna integer.
  '22P02': 'El año debe ser un número entero.',
  // 23505 = unique_violation
  '23505': 'Ya existe un registro con esos datos.',
  // PGRST codes
  PGRST116: 'No se encontró el registro solicitado.',
  PGRST301: 'La consulta excede el límite permitido. Intenta de nuevo.',
};

const MENSAJES_POR_FRAGMENTO: [RegExp, string][] = [
  [
    /JWT|token|session|auth/i,
    'Tu sesión no es válida o expiró. Cierra sesión e inicia sesión nuevamente.',
  ],
  [
    /Failed to fetch|Network request failed|ECONNREFUSED|ENOTFOUND/i,
    'No se pudo conectar con el servidor. Revisa tu conexión a internet.',
  ],
  [
    /row-level security|violates row-level/i,
    'No tienes permisos para realizar esta operación. Verifica que tu sesión esté activa y que las políticas RLS estén aplicadas.',
  ],
  [
    /does not exist|schema cache/i,
    'La tabla libros no existe o no fue encontrada en el proyecto de Supabase. Ejecuta el script 001_libros.sql.',
  ],
];

const MENSAJE_POR_DEFECTO = 'Ocurrió un error inesperado. Intenta nuevamente.';

/**
 * Traduce un error de Supabase a un mensaje que sí se puede mostrar.
 * Nunca devuelve el texto técnico crudo como mensaje principal.
 */
export function traducirError(
  error: ErrorSupabase,
  mensajePorDefecto: string = MENSAJE_POR_DEFECTO,
): ErrorTraducido {
  if (!error) {
    return { mensaje: mensajePorDefecto };
  }

  const codigo = error.code ?? '';
  const crudo = `${error.message ?? ''} ${error.details ?? ''} ${error.hint ?? ''}`;

  const porCodigo = MENSAJES_POR_CODIGO[codigo];
  if (porCodigo) {
    return { mensaje: porCodigo, detalleTecnico: crudo.trim() || undefined };
  }

  for (const [patron, mensaje] of MENSAJES_POR_FRAGMENTO) {
    if (patron.test(crudo)) {
      return { mensaje, detalleTecnico: crudo.trim() || undefined };
    }
  }

  return { mensaje: mensajePorDefecto, detalleTecnico: crudo.trim() || undefined };
}

/** Mensaje listo para mostrar en la interfaz. */
export function mensajeDeError(
  error: ErrorSupabase,
  mensajePorDefecto: string = MENSAJE_POR_DEFECTO,
): string {
  return traducirError(error, mensajePorDefecto).mensaje;
}

/**
 * Traduce errores de `supabase.auth`. Usa el mismo vocabulario para que el
 * usuario no vea códigos internos.
 */
export function traducirErrorAuth(
  error: { message: string; code?: string | null; status?: number | null } | null,
): string {
  if (!error) return MENSAJE_POR_DEFECTO;

  const codigo = (error.code ?? '').toUpperCase();
  const mensaje = error.message ?? '';

  if (
    codigo === 'INVALID_CREDENTIALS' ||
    /invalid login credentials/i.test(mensaje)
  ) {
    return 'Correo o contraseña incorrectos.';
  }

  if (codigo === 'EMAIL_NOT_CONFIRMED' || /not confirmed/i.test(mensaje)) {
    return 'Debes confirmar tu correo electrónico antes de iniciar sesión.';
  }

  if (codigo === 'USER_ALREADY_EXISTS' || /already registered|already been registered/i.test(mensaje)) {
    return 'Ese correo ya tiene una cuenta. Intenta iniciar sesión.';
  }

  if (codigo === 'WEAK_PASSWORD' || /password should be at least/i.test(mensaje)) {
    return 'La contraseña es demasiado débil.';
  }

  if (codigo === 'OVER_EMAIL_SEND_RATE_LIMIT' || /rate limit/i.test(mensaje)) {
    return 'Se enviaron demasiadas solicitudes. Espera unos minutos e intenta de nuevo.';
  }

  if (codigo === 'INVALID_EMAIL' || /unable to validate email/i.test(mensaje)) {
    return 'El correo electrónico no tiene un formato válido.';
  }

  return traducirError({ message: mensaje, code: error.code }).mensaje;
}