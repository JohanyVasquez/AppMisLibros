import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { COLORES, ESPACIOS, TAMANOS } from '@/constants/estilos';
import {
  validarNuevoLibro,
  type ErroresNuevoLibro,
} from '@/lib/validacion';
import type { NuevoLibro } from '@/types/database.types';

/**
 * Formulario de alta de libro.
 *
 * Conserva los mismos campos del `App.tsx` de la tarea anterior (título,
 * autor, año) y añade el anti-doble-envío: mientras `enviando` es `true` el
 * botón queda deshabilitado, de modo que una pulsación repetida no inserta
 * dos filas.
 *
 * La validación es la misma que usa `LibroRepository` y que replican los CHECK
 * de `001_libros.sql`; no sustituye a la base de datos.
 */
export function FormularioLibro({
  onAgregar,
}: {
  /** Devuelve `true` si el libro se insertó. `false` = falló y hay que conservar los campos. */
  onAgregar: (libro: NuevoLibro) => Promise<boolean>;
}) {
  const [titulo, setTitulo] = useState('');
  const [autor, setAutor] = useState('');
  const [anio, setAnio] = useState('');
  const [errores, setErrores] = useState<ErroresNuevoLibro>({});
  const [enviando, setEnviando] = useState(false);

  const deshabilitado = enviando;

  async function manejarEnvio() {
    if (enviando) return; // guarda contra pulsaciones repetidas

    const validacion = validarNuevoLibro({ titulo, autor, anio });
    setErrores(validacion.errores);

    if (!validacion.valido || validacion.datos === null) return;

    setEnviando(true);
    try {
      const insertado = await onAgregar(validacion.datos);
      // Solo se limpian los campos si Supabase confirmó la inserción.
      // Si falló, el usuario no pierde lo que escribió.
      if (insertado) {
        setTitulo('');
        setAutor('');
        setAnio('');
        setErrores({});
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <View style={styles.contenedor}>
      <TextInput
        style={[styles.input, errores.titulo !== undefined && styles.inputError]}
        placeholder="Título"
        placeholderTextColor={COLORES.textoSecundario}
        value={titulo}
        onChangeText={setTitulo}
        editable={!deshabilitado}
        accessibilityLabel="Título del libro"
      />
      {errores.titulo !== undefined ? (
        <Text style={styles.error}>{errores.titulo}</Text>
      ) : null}

      <TextInput
        style={[styles.input, errores.autor !== undefined && styles.inputError]}
        placeholder="Autor"
        placeholderTextColor={COLORES.textoSecundario}
        value={autor}
        onChangeText={setAutor}
        editable={!deshabilitado}
        accessibilityLabel="Autor del libro"
      />
      {errores.autor !== undefined ? (
        <Text style={styles.error}>{errores.autor}</Text>
      ) : null}

      <TextInput
        style={[styles.input, errores.anio !== undefined && styles.inputError]}
        placeholder="Año"
        placeholderTextColor={COLORES.textoSecundario}
        value={anio}
        onChangeText={setAnio}
        keyboardType="number-pad"
        editable={!deshabilitado}
        accessibilityLabel="Año de publicación"
      />
      {errores.anio !== undefined ? (
        <Text style={styles.error}>{errores.anio}</Text>
      ) : null}

      <TouchableOpacity
        style={[styles.boton, deshabilitado && styles.botonDeshabilitado]}
        onPress={manejarEnvio}
        disabled={deshabilitado}
        accessibilityRole="button"
      >
        {enviando ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.textoBoton}>Agregar libro</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { marginBottom: ESPACIOS.separacion * 2 },
  input: {
    backgroundColor: COLORES.tarjeta,
    borderWidth: 1,
    borderColor: COLORES.borde,
    padding: ESPACIOS.campo,
    borderRadius: ESPACIOS.radio,
    marginBottom: ESPACIOS.separacion,
    fontSize: TAMANOS.texto,
    color: COLORES.texto,
  },
  inputError: { borderColor: COLORES.peligro },
  error: {
    color: COLORES.peligro,
    fontSize: 13,
    marginTop: -6,
    marginBottom: ESPACIOS.separacion,
  },
  boton: {
    backgroundColor: COLORES.primario,
    padding: 14,
    borderRadius: ESPACIOS.radio,
    alignItems: 'center',
    marginTop: 4,
  },
  botonDeshabilitado: { opacity: 0.6 },
  textoBoton: { color: '#ffffff', fontWeight: 'bold', fontSize: TAMANOS.texto },
});