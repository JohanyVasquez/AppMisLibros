# Mis Libros — Repository y Singleton

Aplicación móvil desarrollada con React Native, Expo y TypeScript para el curso Programación II. Esta versión continúa el proyecto **Mis Libros** e incorpora los patrones **Repository** y **Singleton**.

## Funcionalidades

- Visualizar libros.
- Agregar un libro indicando título, autor y año.
- Eliminar libros.
- Administrar los datos mediante `LibroRepository`.
- Utilizar una única instancia del Repository mediante Singleton.

## Estructura

```text
App.tsx
   ↓
LibroService
   ↓
LibroRepository (Singleton)
   ↓
Datos Mock
```

```text
src/
├── models/
│   └── Libro.ts
├── services/
│   └── LibroService.ts
└── repositories/
    └── LibroRepository.ts
```

## Cambios realizados

Se creó `LibroRepository`, que ahora tiene la responsabilidad de mantener la colección de libros y realizar las operaciones de obtener, agregar y eliminar libros. De esta manera, `App.tsx` no administra directamente la colección y `LibroService` utiliza el Repository para acceder a los datos.

También se implementó el patrón **Singleton** en `LibroRepository`. El constructor es privado y la instancia se obtiene únicamente mediante `LibroRepository.getInstance()`. Esto permite que toda la aplicación utilice una sola instancia del Repository.

## Prueba del Singleton

En `App.tsx` se realizan dos llamadas a `LibroRepository.getInstance()` y se comparan las referencias:

```ts
const repository1 = LibroRepository.getInstance();
const repository2 = LibroRepository.getInstance();

console.log(
  "¿Repository 1 y Repository 2 son la misma instancia?",
  repository1 === repository2
);
```

El resultado esperado en la consola es:

```text
¿Repository 1 y Repository 2 son la misma instancia? true
```

El valor `true` demuestra que ambas llamadas retornan la misma instancia.

## Evidencia de la aplicación

La captura de la aplicación se encuentra en `assets/captura-aplicacion.jpeg`.

![Aplicación Mis Libros](assets/captura-aplicacion.jpeg)

## Evidencia del Singleton

Para completar la evidencia solicitada, ejecutar la aplicación con `npx expo start`, abrir la consola y tomar una captura donde se vea el mensaje de la prueba Singleton con resultado `true`. Guardarla como `assets/captura-singleton.png` y agregarla al mismo repositorio.

## Tecnologías

- React Native
- Expo
- TypeScript
