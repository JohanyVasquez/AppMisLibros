import { Stack } from 'expo-router';
import React from 'react';

/**
 * Grupo público. Solo existe cuando NO hay sesión.
 * `login` se declara primero: es la pantalla a la que Expo Router lleva al
 * usuario sin sesión. Reordenar este layout cambia el punto de entrada.
 */
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}