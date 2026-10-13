import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { COLORES, ESPACIOS, TAMANOS } from '@/constants/estilos';
import type { Libro } from '@/models/Libro';

/**
 * Tarjeta de un libro en el listado.
 * Mantiene la misma estructura visual que el `FlatList` de la tarea anterior.
 */
export function TarjetaLibro({
  libro,
  onPress,
  onEliminar,
  eliminando,
}: {
  libro: Libro;
  onPress?: () => void;
  onEliminar?: () => void;
  eliminando?: boolean;
}) {
  return (
    <View style={styles.tarjeta}>
      <View style={styles.info}>
        <Text style={styles.nombreLibro}>{libro.getTitulo()}</Text>
        <Text style={styles.dato}>Autor: {libro.getAutor()}</Text>
        <Text style={styles.dato}>Año: {libro.getAnio()}</Text>
        <Text style={styles.descripcion}>{libro.obtenerDescripcion()}</Text>
      </View>
      <View style={styles.acciones}>
        {onPress !== undefined ? (
          <Text
            accessibilityRole="button"
            onPress={onPress}
            style={styles.enlace}
          >
            Ver
          </Text>
        ) : null}
        {onEliminar !== undefined ? (
          <Text
            accessibilityRole="button"
            accessibilityState={{ disabled: eliminando === true }}
            onPress={onEliminar}
            disabled={eliminando === true}
            style={[styles.enlace, styles.enlacePeligro]}
          >
            {eliminando === true ? 'Eliminando…' : 'Eliminar'}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    backgroundColor: COLORES.tarjeta,
    padding: ESPACIOS.tarjeta,
    borderRadius: ESPACIOS.radio,
    marginBottom: ESPACIOS.separacion,
    borderWidth: 1,
    borderColor: COLORES.borde,
  },
  info: { flex: 1 },
  nombreLibro: {
    fontSize: TAMANOS.tituloTarjeta,
    fontWeight: 'bold',
    color: COLORES.texto,
  },
  dato: {
    marginTop: 4,
    fontSize: TAMANOS.texto,
    color: COLORES.texto,
  },
  descripcion: {
    marginTop: 5,
    fontStyle: 'italic',
    fontSize: 13,
    color: COLORES.textoSecundario,
  },
  acciones: {
    marginLeft: ESPACIOS.separacion,
    alignItems: 'flex-end',
    gap: 8,
  },
  enlace: {
    color: COLORES.primario,
    fontWeight: 'bold',
    paddingVertical: 4,
  },
  enlacePeligro: { color: COLORES.peligro },
});