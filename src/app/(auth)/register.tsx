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
import { validarEmail, validarPassword } from '@/lib/validacion';

/**
 * Pantalla de registro (ruta pública).
 *
 * Un registro NO implica sesión activa: si el proyecto de Supabase tiene
 * activada la confirmación por correo, `signUp` devuelve `session: null`. Por
 * eso el formulario distingue entre "entrando…" y "revisa tu correo", en lugar
 * de asumir que el usuario ya está dentro.
 */
export default function RegisterScreen() {
  const { registrar } = useAuthContext();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function manejarEnvio() {
    if (enviando) return; // evita registros duplicados

    setError(null);
    setExito(null);

    const errorEmail = validarEmail(email);
    if (errorEmail !== null) {
      setError(errorEmail);
      return;
    }

    const errorPassword = validarPassword(password);
    if (errorPassword !== null) {
      setError(errorPassword);
      return;
    }

    if (password !== confirmarPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setEnviando(true);
    try {
      const resultado = await registrar(email, password);
      // El mensaje ya distingue entre "ya estás dentro" y "confirma tu correo".
      // Si hay sesión, el guard de sesión se encarga de mostrar `(app)`.
      setExito(resultado.mensaje);
      setPassword('');
      setConfirmarPassword('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear la cuenta.');
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
        <Text style={styles.titulo}>Crear cuenta</Text>
        <Text style={styles.subtitulo}>
          Regístrate para empezar a usar Mis Libros
        </Text>

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
          placeholder="Contraseña (mínimo 6 caracteres)"
          placeholderTextColor={COLORES.textoSecundario}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          textContentType="newPassword"
          editable={!enviando}
          accessibilityLabel="Contraseña"
        />

        <TextInput
          style={styles.input}
          placeholder="Confirmar contraseña"
          placeholderTextColor={COLORES.textoSecundario}
          value={confirmarPassword}
          onChangeText={setConfirmarPassword}
          secureTextEntry
          autoCapitalize="none"
          textContentType="newPassword"
          editable={!enviando}
          accessibilityLabel="Confirmar contraseña"
          onSubmitEditing={() => void manejarEnvio()}
        />

        {error !== null ? <MensajeError mensaje={error} /> : null}
        {exito !== null ? <MensajeError mensaje={exito} tono="exito" /> : null}

        <TouchableOpacity
          style={[styles.boton, enviando && styles.botonDeshabilitado]}
          onPress={() => void manejarEnvio()}
          disabled={enviando}
          accessibilityRole="button"
        >
          {enviando ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.textoBoton}>Registrarme</Text>
          )}
        </TouchableOpacity>

        <View style={styles.pie}>
          <Text style={styles.pieTexto}>¿Ya tienes cuenta?</Text>
          <Link href="/login" asChild>
            <TouchableOpacity accessibilityRole="link">
              <Text style={styles.enlace}>Iniciar sesión</Text>
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