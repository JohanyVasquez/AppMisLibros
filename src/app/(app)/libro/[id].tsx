import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Dialogo } from '@/components/Dialogo';
import { MensajeError } from '@/components/MensajeError';
import { COLORES, ESPACIOS, TAMANOS } from '@/constants/estilos';
import { Libro } from '@/models/Libro';
import { LibroRepositoryError } from '@/repositories/LibroRepository';
import { libroService } from '@/services/LibroService';

/**
 * Detalle de un libro (ruta privada).
 *
 * La biblioteca es compartida, así que el detalle también viene de Supabase:
 * se vuelve a consultar por `id` en lugar de confiar en datos cacheados.
 */
export default function DetalleLibroScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [libro, setLibro] = useState<Libro | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogoVisible, setDialogoVisible] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  useEffect(() => {
    const idNumero = Number(id);

    if (!Number.isFinite(idNumero)) {
      setError('El identificador del libro no es válido.');
      setCargando(false);
      return;
    }

    let vigente = true;

    (async () => {
      try {
        const todos = await libroService.obtenerLibros();
        if (!vigente) return;
        const encontrado = todos.find((item) => item.getId() === idNumero) ?? null;
        if (encontrado === null) {
          setError('Ese libro ya no está en la biblioteca.');
        } else {
          setLibro(encontrado);
        }
      } catch (e) {
        if (vigente) {
          setError(
            e instanceof LibroRepositoryError
              ? e.message
              : 'No se pudo cargar el libro.',
          );
        }
      } finally {
        if (vigente) setCargando(false);
      }
    })();

    return () => {
      vigente = false;
    };
  }, [id]);

  async function ejecutarEliminar() {
    if (libro === null) return;
    setEliminando(true);
    try {
      await libroService.eliminarLibro(libro.getId());
      setDialogoVisible(false);
      router.back();
    } catch (e) {
      setDialogoVisible(false);
      setError(
        e instanceof LibroRepositoryError
          ? e.message
          : 'No se pudo eliminar el libro.',
      );
    } finally {
      setEliminando(false);
    }
  }

  if (cargando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color={COLORES.primario} />
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.fondo} contentContainerStyle={styles.contenedor}>
        {error !== null ? <MensajeError mensaje={error} /> : null}

        {libro !== null ? (
          <View style={styles.tarjeta}>
            <Text style={styles.titulo}>{libro.getTitulo()}</Text>
            <Text style={styles.linea}>Autor: {libro.getAutor()}</Text>
            <Text style={styles.linea}>Año: {libro.getAnio()}</Text>
            <Text style={styles.descripcion}>{libro.obtenerDescripcion()}</Text>
            <Text style={styles.nota}>
              Biblioteca compartida: cualquier usuario autenticado puede ver
              este libro.
            </Text>
          </View>
        ) : null}

        {libro !== null ? (
          <TouchableOpacity
            style={styles.botonEliminar}
            onPress={() => setDialogoVisible(true)}
            accessibilityRole="button"
          >
            <Text style={styles.textoBoton}>Eliminar libro</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={styles.botonVolver}
          onPress={() => router.back()}
          accessibilityRole="button"
        >
          <Text style={styles.textoEnlace}>Volver a la lista</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Se usa `Dialogo` (Modal) y no `Alert.alert`, que es un no-op en web. */}
      <Dialogo
        visible={dialogoVisible && libro !== null}
        titulo="Eliminar libro"
        mensaje={libro !== null ? `¿Eliminar "${libro.getTitulo()}"?` : undefined}
        textoConfirmar="Eliminar"
        onConfirm={() => void ejecutarEliminar()}
        onCancel={() => setDialogoVisible(false)}
        destructivo
        confirmando={eliminando}
      />
    </>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: COLORES.fondo },
  centrado: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contenedor: { padding: ESPACIOS.pantalla },
  tarjeta: {
    backgroundColor: COLORES.tarjeta,
    padding: ESPACIOS.tarjeta,
    borderRadius: ESPACIOS.radio,
    borderWidth: 1,
    borderColor: COLORES.borde,
  },
  titulo: {
    fontSize: TAMANOS.titulo,
    fontWeight: 'bold',
    color: COLORES.texto,
    marginBottom: ESPACIOS.separacion,
  },
  linea: { fontSize: TAMANOS.texto, color: COLORES.texto, marginTop: 4 },
  descripcion: {
    marginTop: ESPACIOS.separacion,
    fontStyle: 'italic',
    color: COLORES.textoSecundario,
  },
  nota: {
    marginTop: ESPACIOS.separacion * 1.5,
    fontSize: 13,
    color: COLORES.textoSecundario,
  },
  botonEliminar: {
    backgroundColor: COLORES.peligro,
    padding: 14,
    borderRadius: ESPACIOS.radio,
    alignItems: 'center',
    marginTop: ESPACIOS.separacion * 1.5,
  },
  botonVolver: {
    padding: 14,
    alignItems: 'center',
    marginTop: ESPACIOS.separacion,
  },
  textoBoton: { color: '#ffffff', fontWeight: 'bold', fontSize: TAMANOS.texto },
  textoEnlace: { color: COLORES.primario, fontWeight: 'bold' },
});