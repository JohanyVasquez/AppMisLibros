import type { FilaLibro } from '@/types/database.types';

/**
 * Modelo de dominio `Libro`.
 *
 * Se conserva tal cual de la tarea anterior (Programación II, patrón
 * Repository + Singleton) para no perder trabajo previo: sigue siendo una
 * clase con encapsulation por getters y el método `obtenerDescripcion()` que
 * las pantallas ya venían usando.
 *
 * Sus propiedades corresponden uno a uno con las columnas de `public.libros`:
 * `id` → `id`, `titulo` → `titulo`, `autor` → `autor`, `anio` → `anio`.
 */
export class Libro {
  private id: number;
  private titulo: string;
  private autor: string;
  private anio: number;

  constructor(id: number, titulo: string, autor: string, anio: number) {
    this.id = id;
    this.titulo = titulo;
    this.autor = autor;
    this.anio = anio;
  }

  /**
   * Reconstruye el modelo desde una fila de PostgREST.
   * El mapeo es explícito a propósito: si el SQL cambiara, el error aparece
   * aquí y no de forma silenciosa en la UI.
   */
  public static desdeFila(fila: FilaLibro): Libro {
    return new Libro(fila.id, fila.titulo, fila.autor, fila.anio);
  }

  public getId(): number {
    return this.id;
  }

  public getTitulo(): string {
    return this.titulo;
  }

  public getAutor(): string {
    return this.autor;
  }

  public getAnio(): number {
    return this.anio;
  }

  public obtenerDescripcion(): string {
    return `${this.titulo} - ${this.autor} (${this.anio})`;
  }
}