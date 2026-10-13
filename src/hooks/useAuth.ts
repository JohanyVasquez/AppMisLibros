import { useAuthContext, type AuthContextValue } from '@/contexts/AuthContext';

/**
 * Hook de conveniencia para las pantallas.
 * Reexporta el contexto para que los componentes no importen dos rutas distintas.
 */
export function useAuth(): AuthContextValue {
  return useAuthContext();
}