import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { traducirError, traducirErrorAuth } from './errores';

/**
 * Pruebas de la traducción de errores.
 * Objetivo: nunca dejar que un mensaje crudo de Postgres/Supabase llegue al
 * usuario final. Estas pruebas no necesitan conexión.
 */
describe('traducirError', () => {
  it('traduce el error de permisos de RLS', () => {
    const resultado = traducirError({
      message: 'new row violates row-level security policy for table "libros"',
      code: '42501',
    });

    assert.match(resultado.mensaje, /permisos/i);
    // El detalle técnico se conserva aparte, no se muestra.
    assert.ok(resultado.detalleTecnico !== undefined);
  });

  it('traduce una violación de CHECK', () => {
    const resultado = traducirError({
      message: 'new row violates check constraint "libros_anio_valido"',
      code: '23514',
    });

    assert.match(resultado.mensaje, /validaciones/i);
  });

  it('traduce un problema de red', () => {
    const resultado = traducirError({ message: 'TypeError: Failed to fetch' });

    assert.match(resultado.mensaje, /conectar/i);
  });

  it('traduce una tabla inexistente', () => {
    const resultado = traducirError({
      message: 'relation "public.libros" does not exist',
    });

    assert.match(resultado.mensaje, /001_libros\.sql/);
  });

  it('usa el mensaje por defecto ante la ausencia de error', () => {
    assert.ok(traducirError(null).mensaje.length > 0);
  });

  it('nunca expone el mensaje crudo como mensaje principal', () => {
    const resultado = traducirError({
      message: 'ERROR: syntax error at or near "SELEC"',
      code: '42601',
    });

    assert.ok(!resultado.mensaje.includes('SELEC'));
  });
});

describe('traducirErrorAuth', () => {
  it('traduce credenciales incorrectas', () => {
    const resultado = traducirErrorAuth({
      message: 'Invalid login credentials',
      code: 'invalid_credentials',
    });

    assert.match(resultado, /incorrectos/i);
  });

  it('traduce correo sin confirmar', () => {
    const resultado = traducirErrorAuth({
      message: 'Email not confirmed',
      code: 'email_not_confirmed',
    });

    assert.match(resultado, /confirmar/i);
  });

  it('traduce usuario ya registrado', () => {
    const resultado = traducirErrorAuth({
      message: 'User already registered',
      code: 'user_already_exists',
    });

    assert.match(resultado, /ya tiene una cuenta/i);
  });
});