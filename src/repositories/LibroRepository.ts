import type { PostgrestError } from '@supabase/supabase-js';

import { Libro } from '@/models/Libro';
import { obtenerSupabase, SupabaseConfigError } from '@/lib/supabase';
import { traducirError } from '@/lib/errores';
import { validarNuevoLibro } from '@/lib/validacion';
import type { FilaLibro, NuevoLibro } from '@/types/database.types';

/**
 * Error de negocio del repositorio. Lleva un mensaje ya traducido para
 * mostrar, y opcionalmente el detalle técnico (solo registro en desarrollo).
 */
export class LibroRepositoryError extends Error {
  public readonly detalleTecnico?: string;

  constructor(mensaje: string, detalleTecnico?: string) {
    super(mensaje);
    this.name = 'LibroRepositoryError';
    this.detalleTecnico = detalleTecnico;
  }
}

/**
 * Acceso a datos de `public.libros`.
 *
 * En la tarea anterior este repositorio servía un arreglo Mock y se obtenía con
 * Singleton. Se conserva el patrón Singleton (`getInstance()`) y su interfaz
 * pública (`obtenerLibros`, `agregarLibro`, `eliminarLibro`); lo que cambia es
 * que ahora las operaciones son asíncronas y van contra Supabase en vez de
 * memoria.
 *
 * IMPORTANTE: los errores nunca se convierten en datos. Si Supabase falla, la
 * promesa se rechaza con `LibroRepositoryError`. Devolver una lista vacía o un
 * arreglo Mock ocultaría el fallo y haría creer al usuario que la biblioteca
 * está vacía.
 */
export class LibroRepository {
  private static instancia: LibroRepository | null = null;

  /** Constructor privado: la única forma de obtenerlo es `getInstance()`. */
  private constructor() {}

  public static getInstance(): LibroRepository {
    if (LibroRepository.instancia === null) {
      LibroRepository.instancia = new LibroRepository();
    }
    return LibroRepository.instancia;
  }

  /**
   * Consulta los libros de la biblioteca compartida.
   * Orden estable: ID descendente (los más recientes agregados primero).
   */
  public async obtenerLibros(): Promise<Libro[]> {
    const { data, error } = await obtenerSupabase()
      .from('libros')
      .select('id, titulo, autor, anio')
      .order('id', { ascending: false });

    if (error) {
      throw this.aError(error, 'No se pudieron cargar los libros.');
    }

    const filas = (data ?? []) as FilaLibro[];
    return filas.map((fila) => Libro.desdeFila(fila));
  }

  /**
   * Inserta un libro. Valida y normaliza antes de tocar la base de datos,
   * y deja que PostgreSQL genere el `id`.
   */
  public async agregarLibro(libro: NuevoLibro): Promise<Libro> {
    const validacion = validarNuevoLibro({
      titulo: libro?.titulo,
      autor: libro?.autor,
      anio: libro?.anio,
    });

    if (!validacion.valido || validacion.datos === null) {
      const detalle = Object.values(validacion.errores).join(' ');
      throw new LibroRepositoryError(detalle || 'Los datos del libro no son válidos.');
    }

    const { data, error } = await obtenerSupabase()
      .from('libros')
      .insert({
        titulo: validacion.datos.titulo,
        autor: validacion.datos.autor,
        anio: validacion.datos.anio,
      })
      .select('id, titulo, autor, anio')
      .single();

    if (error) {
      throw this.aError(error, 'No se pudo agregar el libro.');
    }

    return Libro.desdeFila(data as FilaLibro);
  }

  /**
   * Elimina el libro con el ID indicado.
   * `delete().eq('id', id)` afecta únicamente esa fila.
   */
  public async eliminarLibro(id: number): Promise<void> {
    if (!Number.isFinite(id)) {
      throw new LibroRepositoryError('El identificador del libro no es válido.');
    }

    const { error } = await obtenerSupabase().from('libros').delete().eq('id', id);

    if (error) {
      throw this.aError(error, 'No se pudo eliminar el libro.');
    }
  }

  /**
   * Traduce un error de PostgREST y lo envuelve en `LibroRepositoryError`.
   * Los errores de configuración (`.env`) se propagan sin traducir, porque el
   * mensaje ya está escrito para el usuario final.
   */
  private aError(error: PostgrestError, mensajePorDefecto: string): LibroRepositoryError {
    if (__DEV__) {
      console.warn(`[LibroRepository] ${mensajePorDefecto}`, error);
    }
    const { mensaje, detalleTecnico } = traducirError(error, mensajePorDefecto);
    return new LibroRepositoryError(mensaje, detalleTecnico);
  }
}

export { SupabaseConfigError };