/**
 * Contrato de datos de la tabla `public.libros`.
 *
 * Estos tipos reflejan exactamente el SQL de `supabase/migrations/001_libros.sql`:
 *
 * | Columna  | Tipo SQL     | TypeScript |
 * | -------- | ------------ | ---------- |
 * | id       | bigint       | number     |
 * | titulo   | text         | string     |
 * | autor    | text         | string     |
 * | anio     | integer      | number     |
 *
 * No se agregan columnas extra (ni `user_id`, ni `created_at`, etc.).
 */

/** Fila tal como la devuelve PostgREST. */
export type FilaLibro = {
  id: number;
  titulo: string;
  autor: string;
  anio: number;
};

/** Datos necessários para insertar un libro. El `id` lo genera PostgreSQL. */
export type NuevoLibro = Omit<FilaLibro, 'id'>;

/**
 * Forma del tipo `Database` que espera `@supabase/supabase-js` v2.
 * Se escribe a mano porque el proyecto no usa el generador de tipos de Supabase.
 */
export interface Database {
  public: {
    Tables: {
      libros: {
        Row: FilaLibro;
        Insert: NuevoLibro;
        // El script `001_libros.sql` no define columnas con valor por defecto,
        // así que para insertar basta con las tres columnas obligatorias.
        Update: Partial<NuevoLibro>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}