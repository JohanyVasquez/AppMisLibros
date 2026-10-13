import { Stack } from 'expo-router';
import React from 'react';

import { useAuthContext } from '@/contexts/AuthContext';
import { EncabezadoApp } from '@/components/EncabezadoApp';

/**
 * Grupo privado. Solo existe cuando HAY sesión.
 * Aquí viven el listado, el formulario de alta y el detalle.
 */
export default function AppLayout() {
  const { user } = useAuthContext();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#f4f4f4' },
        headerTitleStyle: { color: '#1a1a1a' },
        headerRight: () => <EncabezadoApp correo={user?.email ?? null} />,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Mis Libros' }} />
      <Stack.Screen name="libro/[id]" options={{ title: 'Detalle del libro' }} />
    </Stack>
  );
}