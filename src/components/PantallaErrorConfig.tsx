import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { COLORES, ESPACIOS, TAMANOS } from '@/constants/estilos';

/**
 * Se muestra cuando faltan `EXPO_PUBLIC_SUPABASE_URL` o
 * `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Sin eso no hay cliente de Supabase,
 * así que no tiene sentido mostrar login ni el listado.
 */
export function PantallaErrorConfig({ mensaje }: { mensaje: string }) {
  return (
    <ScrollView style={styles.fondo} contentContainerStyle={styles.contenedor}>
      <Text style={styles.titulo}>📚 Mis Libros</Text>
      <View style={styles.tarjeta}>
        <Text style={styles.encabezado}>Falta configurar Supabase</Text>
        <Text style={styles.mensaje}>{mensaje}</Text>
        <Text style={styles.nota}>
          Recuerda reiniciar el servidor de Expo con{' '}
          <Text style={styles.codigo}>npx expo start -c</Text> después de editar el
          archivo .env.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: COLORES.fondo },
  contenedor: {
    padding: ESPACIOS.pantalla,
    paddingTop: 60,
    flexGrow: 1,
  },
  titulo: {
    fontSize: TAMANOS.titulo,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: ESPACIOS.separacion * 2,
    color: COLORES.texto,
  },
  tarjeta: {
    backgroundColor: COLORES.tarjeta,
    padding: ESPACIOS.tarjeta,
    borderRadius: ESPACIOS.radio,
    borderWidth: 1,
    borderColor: COLORES.borde,
  },
  encabezado: {
    fontSize: TAMANOS.texto,
    fontWeight: 'bold',
    marginBottom: ESPACIOS.separacion,
    color: COLORES.peligro,
  },
  mensaje: {
    fontSize: TAMANOS.texto,
    lineHeight: 22,
    color: COLORES.texto,
  },
  nota: {
    marginTop: ESPACIOS.separacion * 1.5,
    fontSize: 14,
    color: COLORES.textoSecundario,
  },
  codigo: {
    fontFamily: 'monospace',
    color: COLORES.texto,
  },
});