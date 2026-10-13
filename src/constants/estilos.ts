/**
 * Estilos compartidos de Mis Libros.
 * Se extraen aquí para que las pantallas nuevas (login, registro, detalle)
 * mantengan la misma identidad visual que el listado de la tarea anterior:
 * fondo #f4f4f4, tarjetas blancas, azul #007bff para acciones y #dc3545 para eliminar.
 */

export const COLORES = {
  fondo: '#f4f4f4',
  tarjeta: '#ffffff',
  primario: '#007bff',
  peligro: '#dc3545',
  texto: '#1a1a1a',
  textoSecundario: '#666666',
  borde: '#cccccc',
  exito: '#198754',
  aviso: '#b8860b',
} as const;

export const ESPACIOS = {
  pantalla: 20,
  campo: 12,
  tarjeta: 15,
  separacion: 10,
  radio: 8,
} as const;

export const TAMANOS = {
  titulo: 30,
  subtitulo: 22,
  texto: 16,
  tituloTarjeta: 18,
} as const;