import { LibroRepository } from '@/repositories/LibroRepository';
import { Libro } from '@/models/Libro';
import type { NuevoLibro } from '@/types/database.types';

/**
 * Capa de servicio de la biblioteca.
 *
 * Se conserva de la tarea anterior: `LibroService` sigue siendo la fachada que
 * usan las pantallas, y sigue delegando en `LibroRepository`. Lo que cambia es
 * que los métodos ahora son asíncronos porque ya no hay un arreglo en memoria,
 * sino una tabla en Supabase.
 *
 * Los nombres públicos (`obtenerLibros`, `agregarLibro`, `eliminarLibro`) se
 * mantienen para no romper los componentes existentes.
 */
export class LibroService {
  private readonly repository: LibroRepository;

  public constructor(repository: LibroRepository = LibroRepository.getInstance()) {
    this.repository = repository;
  }

  /** Devuelve la instancia única del repositorio. */
  public static getRepository(): LibroRepository {
    return LibroRepository.getInstance();
  }

  /** Lista los libros almacenados en `public.libros`. */
  public obtenerLibros(): Promise<Libro[]> {
    return this.repository.obtenerLibros();
  }

  /** Inserta un libro y devuelve el registro creado (con `id` asignado por Postgres). */
  public agregarLibro(libro: NuevoLibro): Promise<Libro> {
    return this.repository.agregarLibro(libro);
  }

  /** Elimina el libro con el ID indicado. */
  public eliminarLibro(id: number): Promise<void> {
    return this.repository.eliminarLibro(id);
  }
}

/**
 * Una sola instancia del servicio para toda la app, que a su vez comparte
 * la única instancia del repositorio (Singleton).
 */
export const libroService = new LibroService();