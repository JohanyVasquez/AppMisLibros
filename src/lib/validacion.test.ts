import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  ANIO_MAXIMO,
  ANIO_MINIMO,
  normalizarTexto,
  parsearAnio,
  validarEmail,
  validarNuevoLibro,
  validarPassword,
} from './validacion';

/**
 * Pruebas unitarias de la validación.
 *
 * Estas comprobaciones reflejan los CHECK de `001_libros.sql`, pero la base de
 * datos sigue siendo la autoridad final. No hacen falta credenciales de Supabase.
 */
describe('normalizarTexto', () => {
  it('recorta espacios exteriores', () => {
    assert.equal(normalizarTexto('  Cien años  '), 'Cien años');
  });

  it('devuelve cadena vacía para valores nulos o no textuales', () => {
    assert.equal(normalizarTexto(null), '');
    assert.equal(normalizarTexto(undefined), '');
  });

  it('conserva espacios interiores', () => {
    assert.equal(normalizarTexto('  El   amor  '), 'El   amor');
  });
});

describe('parsearAnio', () => {
  it('acepta un año entero válido', () => {
    assert.equal(parsearAnio('1949'), 1949);
    assert.equal(parsearAnio(' 1984 '), 1984);
  });

  it('rechaza valores no numéricos', () => {
    assert.equal(parsearAnio('abc'), null);
    assert.equal(parsearAnio(''), null);
    assert.equal(parsearAnio('19a49'), null);
  });

  it('rechaza decimales', () => {
    assert.equal(parsearAnio('1949.5'), null);
  });
});

describe('validarNuevoLibro', () => {
  it('acepta un libro válido y normaliza los textos', () => {
    const resultado = validarNuevoLibro({
      titulo: '  Rayuela  ',
      autor: '  Cortázar  ',
      anio: '1963',
    });

    assert.equal(resultado.valido, true);
    assert.deepEqual(resultado.datos, {
      titulo: 'Rayuela',
      autor: 'Cortázar',
      anio: 1963,
    });
  });

  it('rechaza un título vacío o solo con espacios', () => {
    const resultado = validarNuevoLibro({ titulo: '   ', autor: 'Autor', anio: '1900' });

    assert.equal(resultado.valido, false);
    assert.ok(resultado.errores.titulo !== undefined);
    assert.equal(resultado.datos, null);
  });

  it('rechaza un autor vacío o solo con espacios', () => {
    const resultado = validarNuevoLibro({
      titulo: 'Libro',
      autor: '\t  ',
      anio: '1900',
    });

    assert.equal(resultado.valido, false);
    assert.ok(resultado.errores.autor !== undefined);
  });

  it('acepta los límites del rango de año', () => {
    assert.equal(
      validarNuevoLibro({ titulo: 'A', autor: 'B', anio: ANIO_MINIMO }).valido,
      true,
    );
    assert.equal(
      validarNuevoLibro({ titulo: 'A', autor: 'B', anio: ANIO_MAXIMO }).valido,
      true,
    );
  });

  it('rechaza años fuera del rango 1..2100', () => {
    const resultado = validarNuevoLibro({
      titulo: 'A',
      autor: 'B',
      anio: String(ANIO_MAXIMO + 1),
    });

    assert.equal(resultado.valido, false);
    assert.ok(resultado.errores.anio !== undefined);
  });

  it('rechaza un año no numérico', () => {
    const resultado = validarNuevoLibro({ titulo: 'A', autor: 'B', anio: 'mil' });

    assert.equal(resultado.valido, false);
    assert.ok(resultado.errores.anio !== undefined);
  });
});

describe('validarEmail', () => {
  it('acepta un correo con formato válido', () => {
    assert.equal(validarEmail('lector@ejemplo.com'), null);
  });

  it('rechaza vacío, sin @ o sin dominio', () => {
    assert.ok(validarEmail('') !== null);
    assert.ok(validarEmail('   ') !== null);
    assert.ok(validarEmail('lector@') !== null);
    assert.ok(validarEmail('lector.ejemplo.com') !== null);
  });
});

describe('validarPassword', () => {
  it('acepta una contraseña de longitud suficiente', () => {
    assert.equal(validarPassword('secreto'), null);
  });

  it('rechaza vacías y demasiado cortas', () => {
    assert.ok(validarPassword('') !== null);
    assert.ok(validarPassword('123') !== null);
  });
});