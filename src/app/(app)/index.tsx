import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Dialogo } from '@/components/Dialogo';
import { FormularioLibro } from '@/components/FormularioLibro';
import { MensajeError } from '@/components/MensajeError';
import { TarjetaLibro } from '@/components/TarjetaLibro';
import { COLORES, ESPACIOS, TAMANOS } from '@/constants/estilos';
import { Libro } from '@/models/Libro';
import { LibroRepositoryError } from '@/repositories/LibroRepository';
import { libroService } from '@/services/LibroService';
import type { NuevoLibro } from '@/types/database.types';

/**
 * Home / listado de libros (ruta privada, dentro de `(app)`).
 *
 * El listado ya NO sale de un arreglo Mock: viene de `public.libros` a través
 * de `LibroService` → `LibroRepository`. Si la consulta falla se muestra un
 * error recuperable con botón de reintento; nunca se sustituye el fallo por
 * datos ficticios, porque eso haría creer al usuario que la biblioteca está
 * vacía cuando en realidad es un problema de conexión o de permisos.
 */
export default function HomeScreen() {
  const router = useRouter();

  const [libros, setLibros] = useState<Libro[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [errorOperacion, setErrorOperacion] = useState<string | null>(null);
  const [idEliminando, setIdEliminando] = useState<number | null>(null);

  const cargar = useCallback(async (mostrarSpinner: boolean) => {
    if (mostrarSpinner) setCargando(true);
    setErrorCarga(null);
    try {
      const resultado = await libroService.obtenerLibros();
      setLibros(resultado);
    } catch (e) {
      const mensaje =
        e instanceof LibroRepositoryError
          ? e.message
          : 'No se pudieron cargar los libros.';
      setErrorCarga(mensaje);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      // `cargando` solo en la primera carga; al volver de otra pantalla
      // se refresca en silencio para no parpadear.
      void cargar(libros.length === 0);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cargar]),
  );

  async function manejarAgregar(nuevo: NuevoLibro): Promise<boolean> {
    setErrorOperacion(null);
    try {
      await libroService.agregarLibro(nuevo);
      // Solo tras un insert confirmado por Supabase se recarga la lista.
      await cargar(false);
      return true;
    } catch (e) {
      setErrorOperacion(
        e instanceof LibroRepositoryError
          ? e.message
          : 'No se pudo agregar el libro.',
      );
      return false;
    }
  }

  // Libro pendiente de confirmación en el diálogo de eliminación.
  const [libroAEliminar, setLibroAEliminar] = useState<Libro | null>(null);

  async function ejecutarEliminar(libro: Libro) {
    setErrorOperacion(null);
    setIdEliminando(libro.getId());
    try {
      await libroService.eliminarLibro(libro.getId());
      // El registro solo desaparece de la vista después del DELETE exitoso.
      setLibroAEliminar(null);
      await cargar(false);
    } catch (e) {
      setErrorOperacion(
        e instanceof LibroRepositoryError
          ? e.message
          : 'No se pudo eliminar el libro.',
      );
    } finally {
      setIdEliminando(null);
    }
  }

  if (cargando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color={COLORES.primario} />
        <Text style={styles.textoSecundario}>Cargando libros…</Text>
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={libros}
        keyExtractor={(item) => String(item.getId())}
        style={styles.lista}
        contentContainerStyle={styles.contenedorLista}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={() => {
              setRefrescando(true);
              void cargar(false);
            }}
            tintColor={COLORES.primario}
          />
        }
        ListHeaderComponent={
          <View>
            <Text style={styles.subtitulo}>Agregar libro</Text>
            <FormularioLibro onAgregar={manejarAgregar} />
            {errorOperacion !== null ? (
              <MensajeError mensaje={errorOperacion} />
            ) : null}
            <Text style={styles.subtitulo}>Lista de libros</Text>
            {errorCarga !== null ? (
              <View>
                <MensajeError mensaje={errorCarga} />
                <TouchableOpacity
                  style={styles.botonReintentar}
                  onPress={() => void cargar(true)}
                  accessibilityRole="button"
                >
                  <Text style={styles.textoBoton}>Reintentar</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          errorCarga === null ? (
            <Text style={styles.vacio}>No hay libros registrados.</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <TarjetaLibro
            libro={item}
            onPress={() => router.push(`/libro/${item.getId()}`)}
            onEliminar={() => setLibroAEliminar(item)}
            eliminando={idEliminando === item.getId()}
          />
        )}
      />

      {/* Confirmación de eliminación. Se usa `Dialogo` (Modal) y no
          `Alert.alert`, que es un no-op en web. */}
      <Dialogo
        visible={libroAEliminar !== null}
        titulo="Eliminar libro"
        mensaje={
          libroAEliminar !== null
            ? `¿Seguro que quieres eliminar "${libroAEliminar.getTitulo()}"?`
            : undefined
        }
        textoConfirmar="Eliminar"
        onConfirm={() => {
          if (libroAEliminar !== null) void ejecutarEliminar(libroAEliminar);
        }}
        onCancel={() => setLibroAEliminar(null)}
        destructivo
        confirmando={idEliminando === libroAEliminar?.getId()}
      />
    </>
  );
}

const styles = StyleSheet.create({
  lista: { flex: 1, backgroundColor: COLORES.fondo },
  contenedorLista: {
    padding: ESPACIOS.pantalla,
  },
  centrado: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORES.fondo,
  },
  subtitulo: {
    fontSize: TAMANOS.subtitulo,
    fontWeight: 'bold',
    color: COLORES.texto,
    marginBottom: ESPACIOS.separacion + 2,
  },
  textoSecundario: {
    marginTop: ESPACIOS.separacion,
    color: COLORES.textoSecundario,
  },
  vacio: {
    textAlign: 'center',
    color: COLORES.textoSecundario,
    marginTop: ESPACIOS.separacion * 2,
  },
  botonReintentar: {
    backgroundColor: COLORES.primario,
    padding: 12,
    borderRadius: ESPACIOS.radio,
    alignItems: 'center',
    marginTop: 4,
  },
  textoBoton: { color: '#ffffff', fontWeight: 'bold', fontSize: TAMANOS.texto },
});