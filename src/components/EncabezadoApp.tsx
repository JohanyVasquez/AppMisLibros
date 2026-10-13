import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { Dialogo } from '@/components/Dialogo';
import { COLORES, ESPACIOS, TAMANOS } from '@/constants/estilos';
import { useAuthContext } from '@/contexts/AuthContext';

/**
 * Botón de cierre de sesión del encabezado.
 *
 * Llama al `AuthService` real (`signOut`). Cuando Supabase confirma el cierre,
 * `onAuthStateChange` actualiza el contexto, `isAuthenticated` pasa a `false` y
 * el layout raíz habilita el grupo `(auth)`. No hay `router.replace` aquí: la
 * navegación la decide el estado de sesión, no la pantalla.
 *
 * La confirmación usa `Dialogo` (Modal) y no `Alert.alert`, porque `Alert.alert`
 * es un no-op en web y el botón nunca se disparaba.
 */
export function EncabezadoApp({ correo }: { correo: string | null }) {
  const { cerrarSesion } = useAuthContext();

  const [dialogoVisible, setDialogoVisible] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ejecutarCierre() {
    if (cerrando) return;
    setCerrando(true);
    setError(null);
    try {
      await cerrarSesion();
      // Cierre confirmado: el guard de sesión se encarga de mostrar `(auth)`.
      setDialogoVisible(false);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'No se pudo cerrar la sesión.',
      );
    } finally {
      setCerrando(false);
    }
  }

  return (
    <>
      <TouchableOpacity
        onPress={() => {
          setError(null);
          setDialogoVisible(true);
        }}
        disabled={cerrando}
        accessibilityRole="button"
        accessibilityLabel="Cerrar sesión"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={styles.boton}
      >
        <Text style={styles.texto}>Salir</Text>
      </TouchableOpacity>

      <Dialogo
        visible={dialogoVisible}
        titulo="Cerrar sesión"
        mensaje={
          correo !== null
            ? `¿Seguro que quieres cerrar sesión de ${correo}?`
            : '¿Seguro que quieres cerrar sesión?'
        }
        textoConfirmar="Cerrar sesión"
        onConfirm={() => void ejecutarCierre()}
        onCancel={() => {
          setDialogoVisible(false);
          setError(null);
        }}
        destructivo
        confirmando={cerrando}
      />

      <Dialogo
        visible={error !== null}
        titulo="No se pudo cerrar sesión"
        mensaje={error ?? ''}
        textoConfirmar="Entendido"
        onConfirm={() => setError(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  boton: {
    marginRight: ESPACIOS.separacion + 2,
    paddingHorizontal: ESPACIOS.separacion,
    paddingVertical: 8,
  },
  texto: {
    color: COLORES.peligro,
    fontWeight: 'bold',
    fontSize: TAMANOS.texto,
  },
});