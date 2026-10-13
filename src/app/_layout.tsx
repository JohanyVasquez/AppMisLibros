import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuthContext } from '@/contexts/AuthContext';
import { PantallaErrorConfig } from '@/components/PantallaErrorConfig';
import { PantallaCarga } from '@/components/PantallaCarga';

/**
 * Layout raíz.
 *
 * Toda la navegación depende del estado de autenticación que expone
 * `AuthProvider`. `Stack.Protected` decide qué grupo de rutas existe:
 *
 *   - isLoading = true  → pantalla de carga, ninguna ruta protegida accesible
 *   - sin sesión         → solo el grupo público `(auth)`; el anclaje es `login`
 *   - con sesión         → solo el grupo privado `(app)`
 *
 * NO existe un `router.replace('/')` después del login: la navegación no depende
 * del resultado de la llamada, depende del token de sesión.
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <NavegacionPorSesion />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function NavegacionPorSesion() {
  const { isLoading, isAuthenticated, errorConfig } = useAuthContext();

  // La configuración de `.env` es un problema anterior a la autenticación:
  // sin URL ni clave no hay nada que restaurar.
  if (errorConfig !== null) {
    return <PantallaErrorConfig mensaje={errorConfig} />;
  }

  if (isLoading) {
    return <PantallaCarga />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}