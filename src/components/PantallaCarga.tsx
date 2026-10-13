import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { COLORES, TAMANOS } from '@/constants/estilos';

/** Pantalla de carga usada mientras se restaura la sesión de Supabase. */
export function PantallaCarga() {
  return (
    <View style={styles.contenedor} accessibilityRole="progressbar">
      <ActivityIndicator size="large" color={COLORES.primario} />
      <Text style={styles.texto}>Comprobando tu sesión…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORES.fondo,
  },
  texto: {
    marginTop: 12,
    fontSize: TAMANOS.texto,
    color: COLORES.textoSecundario,
  },
});