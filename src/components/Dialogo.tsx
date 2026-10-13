import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { COLORES, ESPACIOS, TAMANOS } from '@/constants/estilos';

/**
 * Diálogo de confirmación / aviso, hecho con `Modal`.
 *
 * ¿Por qué no `Alert.alert`? Porque `Alert.alert` es un **no-op en web**: en
 * react-native-web la clase Alert es un stub vacío (`static alert() {}`), así
 * que el diálogo nunca aparece y el `onPress` del botón nunca se dispara. Eso
 * dejaba rotos tanto "Cerrar sesión" como "Eliminar libro" al correr la app en
 * el navegador. `Modal` sí está implementado en las tres plataformas, así que
 * este diálogo funciona igual en web, Android e iOS.
 *
 * Si se omite `onCancel`, el diálogo muestra un único botón y sirve para
 * mostrar mensajes de error.
 */
export function Dialogo({
  visible,
  titulo,
  mensaje,
  textoConfirmar,
  textoCancelar = 'Cancelar',
  onConfirm,
  onCancel,
  destructivo = false,
  confirmando = false,
}: {
  visible: boolean;
  titulo: string;
  mensaje?: string;
  textoConfirmar: string;
  textoCancelar?: string;
  onConfirm: () => void;
  /** Si se omite, no se muestra el botón de cancelar (diálogo informativo). */
  onCancel?: () => void;
  destructivo?: boolean;
  confirmando?: boolean;
}) {
  const hayCancelar = onCancel !== undefined;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      // Cierra con el botón "atrás" de Android y con la tecla Escape en web.
      onRequestClose={hayCancelar ? onCancel : onConfirm}
    >
      <View style={styles.fondo}>
        {/* El fondo es HERMANO de la tarjeta, no su contenedor. Así un toque
            dentro de la tarjeta nunca llega al fondo y el diálogo no se cierra
            al pulsar "Eliminar" o "Cerrar sesión". */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={hayCancelar ? onCancel : undefined}
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
        />

        <View style={styles.tarjeta} accessibilityViewIsModal>
          <Text style={styles.titulo}>{titulo}</Text>

          {mensaje !== undefined ? (
            <Text style={styles.mensaje}>{mensaje}</Text>
          ) : null}

          <View style={styles.acciones}>
            {hayCancelar ? (
              <Pressable
                style={styles.botonSecundario}
                onPress={onCancel}
                disabled={confirmando}
                accessibilityRole="button"
              >
                <Text style={styles.textoSecundario}>{textoCancelar}</Text>
              </Pressable>
            ) : null}

            <Pressable
              style={[
                styles.botonPrimario,
                destructivo && styles.botonDestructivo,
                confirmando && styles.botonOcupado,
              ]}
              onPress={onConfirm}
              disabled={confirmando}
              accessibilityRole="button"
            >
              {confirmando ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.textoPrimario}>{textoConfirmar}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: ESPACIOS.pantalla,
  },
  tarjeta: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORES.tarjeta,
    borderRadius: ESPACIOS.radio * 1.5,
    padding: ESPACIOS.tarjeta + 5,
  },
  titulo: {
    fontSize: TAMANOS.tituloTarjeta,
    fontWeight: 'bold',
    color: COLORES.texto,
    marginBottom: ESPACIOS.separacion,
  },
  mensaje: {
    fontSize: TAMANOS.texto,
    lineHeight: 22,
    color: COLORES.texto,
    marginBottom: ESPACIOS.separacion * 2,
  },
  acciones: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: ESPACIOS.separacion,
  },
  botonSecundario: {
    paddingVertical: 10,
    paddingHorizontal: ESPACIOS.separacion + 2,
    borderRadius: ESPACIOS.radio,
    borderWidth: 1,
    borderColor: COLORES.borde,
  },
  botonPrimario: {
    paddingVertical: 10,
    paddingHorizontal: ESPACIOS.separacion + 6,
    borderRadius: ESPACIOS.radio,
    backgroundColor: COLORES.primario,
    minWidth: 100,
    alignItems: 'center',
  },
  botonDestructivo: { backgroundColor: COLORES.peligro },
  botonOcupado: { opacity: 0.7 },
  textoSecundario: {
    color: COLORES.textoSecundario,
    fontWeight: 'bold',
    fontSize: TAMANOS.texto,
  },
  textoPrimario: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: TAMANOS.texto,
  },
});