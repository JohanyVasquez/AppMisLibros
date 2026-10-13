import { Link } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { MensajeError } from '@/components/MensajeError';
import { COLORES, ESPACIOS, TAMANOS } from '@/constants/estilos';
import { useAuthContext } from '@/contexts/AuthContext';
import { validarEmail } from '@/lib/validacion';

/**
 * Pantalla de inicio de sesión (ruta pública).
 *
 * Tras un `iniciarSesion` exitoso NO se navega a Home: el layout raíz ya
 * tiene `(app)` protegido por `isAuthenticated`, y ese estado cambia cuando
 * Supabase confirma la sesión. Cualquier navegación manual desde aquí sería
 * redundante y podría abrir una pantalla protegida sin token.
 */
export default function LoginScreen() {
  const { iniciarSesion } = useAuthContext();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function manejarEnvio() {
    if (enviando) return; // evita envíos duplicados

    const errorEmail = validarEmail(email);
    if (errorEmail !== null) {
      setError(errorEmail);
      return;
    }
    if (password.length === 0) {
      setError('La contraseña es obligatoria.');
      return;
    }

    setEnviando(true);
    setError(null);
    try {
      await iniciarSesion(email, password);
      // Sin navegación: la redirección la hace el guard de sesión.
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar sesión.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.fondo}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.contenedor}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.titulo}>📚 Mis Libros</Text>
        <Text style={styles.subtitulo}>Inicia sesión para ver tu biblioteca</Text>

        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          placeholderTextColor={COLORES.textoSecundario}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          editable={!enviando}
          accessibilityLabel="Correo electrónico"
        />

        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor={COLORES.textoSecundario}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          textContentType="password"
          editable={!enviando}
          accessibilityLabel="Contraseña"
          onSubmitEditing={() => void manejarEnvio()}
        />

        {error !== null ? <MensajeError mensaje={error} /> : null}

        <TouchableOpacity
          style={[styles.boton, enviando && styles.botonDeshabilitado]}
          onPress={() => void manejarEnvio()}
          disabled={enviando}
          accessibilityRole="button"
        >
          {enviando ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.textoBoton}>Iniciar sesión</Text>
          )}
        </TouchableOpacity>

        <View style={styles.pie}>
          <Text style={styles.pieTexto}>¿Todavía no tienes cuenta?</Text>
          <Link href="/register" asChild>
            <TouchableOpacity accessibilityRole="link">
              <Text style={styles.enlace}>Crear cuenta</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: COLORES.fondo },
  contenedor: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: ESPACIOS.pantalla,
    paddingTop: 60,
  },
  titulo: {
    fontSize: TAMANOS.titulo,
    fontWeight: 'bold',
    textAlign: 'center',
    color: COLORES.texto,
  },
  subtitulo: {
    textAlign: 'center',
    color: COLORES.textoSecundario,
    marginTop: 6,
    marginBottom: ESPACIOS.separacion * 2.5,
  },
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
  boton: {
    backgroundColor: COLORES.primario,
    padding: 14,
    borderRadius: ESPACIOS.radio,
    alignItems: 'center',
    marginTop: ESPACIOS.separacion,
  },
  botonDeshabilitado: { opacity: 0.6 },
  textoBoton: { color: '#ffffff', fontWeight: 'bold', fontSize: TAMANOS.texto },
  pie: {
    marginTop: ESPACIOS.separacion * 2.5,
    alignItems: 'center',
  },
  pieTexto: { color: COLORES.textoSecundario, marginBottom: 6 },
  enlace: { color: COLORES.primario, fontWeight: 'bold', fontSize: TAMANOS.texto },
});