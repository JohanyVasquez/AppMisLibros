import type { NuevoLibro } from '@/types/database.types';

/**
 * Validaciones puras (sin efectos secundarios) usadas por el formulario,
 * por `LibroRepository` y por `AuthService`.
 *
 * Reflejan las restricciones declaradas en `001_libros.sql`:
 *   - `libros_titulo_valido`: length(btrim(titulo)) > 0
 *   - `libros_autor_valido` : length(btrim(autor))  > 0
 *   - `libros_anio_valido`  : anio BETWEEN 1 AND 2100
 *
 * Validar en el cliente NO reemplaza los CHECK de Postgres: es solo feedback
 * inmediato. La base de datos sigue siendo la autoridad.
 */

export const ANIO_MINIMO = 1;
export const ANIO_MAXIMO = 2100;
export const LONGITUD_MINIMA_PASSWORD = 6;

/** Quita espacios exteriores. Si el valor no es texto, devuelve cadena vacía. */
export function normalizarTexto(valor: string | null | undefined): string {
  return typeof valor === 'string' ? valor.trim() : '';
}

/**
 * Convierte lo que el usuario escribió en el campo "Año" a entero.
 * Devuelve `null` si no representa un entero válido (cadena vacía, "abc", "1.5").
 */
export function parsearAnio(valor: string | number | null | undefined): number | null {
  if (typeof valor === 'number') {
    return Number.isInteger(valor) ? valor : null;
  }
  const texto = normalizarTexto(valor);
  if (texto.length === 0 || !/^-?\d+$/.test(texto)) return null;
  const numero = Number(texto);
  return Number.isSafeInteger(numero) ? numero : null;
}

export type ErroresNuevoLibro = {
  titulo?: string;
  autor?: string;
  anio?: string;
};

export type ResultadoValidacion = {
  valido: boolean;
  errores: ErroresNuevoLibro;
  datos: NuevoLibro | null;
};

/**
 * Valida y normaliza los datos de un libro nuevo.
 * Si es válido devuelve `datos` ya normalizados (textos sin espacios exteriores),
 * listos para insertar.
 */
export function validarNuevoLibro(entrada: {
  titulo?: string | null;
  autor?: string | null;
  anio?: string | number | null;
}): ResultadoValidacion {
  const errores: ErroresNuevoLibro = {};

  const titulo = normalizarTexto(entrada.titulo);
  if (titulo.length === 0) {
    errores.titulo = 'El título es obligatorio.';
  }

  const autor = normalizarTexto(entrada.autor);
  if (autor.length === 0) {
    errores.autor = 'El autor es obligatorio.';
  }

  const anio = parsearAnio(entrada.anio);
  if (anio === null) {
    errores.anio = 'El año debe ser un número entero.';
  } else if (anio < ANIO_MINIMO || anio > ANIO_MAXIMO) {
    errores.anio = `El año debe estar entre ${ANIO_MINIMO} y ${ANIO_MAXIMO}.`;
  }

  const valido = Object.keys(errores).length === 0;

  return {
    valido,
    errores,
    datos: valido ? { titulo, autor, anio: anio as number } : null,
  };
}

// --- Autenticación -------------------------------------------------------

/**
 * Validación de correo. Acepta un formato razonable, no aplica la spec completa
 * de RFC 5322; Supabase es quien decide realmente si el correo existe.
 */
export function validarEmail(correo: string | null | undefined): string | null {
  const valor = normalizarTexto(correo);
  if (valor.length === 0) return 'El correo electrónico es obligatorio.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) {
    return 'El correo electrónico no tiene un formato válido.';
  }
  return null;
}

export function validarPassword(password: string | null | undefined): string | null {
  const valor = typeof password === 'string' ? password : '';
  if (valor.length === 0) return 'La contraseña es obligatoria.';
  if (valor.length < LONGITUD_MINIMA_PASSWORD) {
    return `La contraseña debe tener al menos ${LONGITUD_MINIMA_PASSWORD} caracteres.`;
  }
  return null;
}