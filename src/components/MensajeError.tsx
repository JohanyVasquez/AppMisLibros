import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { COLORES } from '@/constants/estilos';

/** Mensaje de error recuperable. `tono` permite distinguir error y advertencia. */
export function MensajeError({
  mensaje,
  tono = 'error',
}: {
  mensaje: string;
  tono?: 'error' | 'exito' | 'aviso';
}) {
  const color =
    tono === 'exito' ? COLORES.exito : tono === 'aviso' ? COLORES.aviso : COLORES.peligro;

  return (
    <View
      accessibilityRole="alert"
      style={[styles.contenedor, { borderColor: color }]}
    >
      <Text style={[styles.texto, { color }]}>{mensaje}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginVertical: 6,
  },
  texto: {
    fontSize: 14,
    lineHeight: 20,
  },
});