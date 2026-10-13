Mis Libros

Aplicación móvil para la materia **Programación II** que permite registrar,
consultar y eliminar libros de una **biblioteca compartida**, con usuarios
identificados mediante **Supabase Auth** y acceso a los datos protegido por
**Row Level Security (RLS)**.

Esta versión continúa el proyecto de las tareas anteriores y conserva su
arquitectura (**Model + Service + Repository con Singleton**). Lo nuevo es que
los datos ya no viven en un arreglo Mock: se consultan en **Supabase
(PostgreSQL)**, y toda la aplicación está detrás de autenticación.

---

1. Descripción general

**Mis Libros** es una app Expo / React Native / TypeScript con cinco
capacidades:

1. **Registro e inicio de sesión** con correo y contraseña (Supabase Auth).
2. **Listado** de libros leído desde `public.libros`.
3. **Alta** de libros con título, autor y año.
4. **Eliminación** de libros con confirmación visual.
5. **Cierre de sesión** que devuelve al usuario al flujo público.

La biblioteca es **compartida**: todos los usuarios autenticados ven y modifican
la misma colección de libros. Esta versión **no** tiene libros por usuario
(el esquema no incluye `user_id`).

2. Tecnologías

| Área | Tecnología |
| --- | --- |
| Framework | React Native 0.81.4 |
| Plataforma | Expo SDK 54 (`expo ~54.0.0`) |
| Lenguaje | TypeScript 5.9 |
| Navegación | Expo Router 6 (`expo-router/entry`, rutas en `src/app`) |
| Backend | Supabase Database (PostgreSQL) |
| Autenticación | Supabase Auth (correo + contraseña) |
| Persistencia de sesión | `@react-native-async-storage/async-storage` |
| Cliente HTTP | `@supabase/supabase-js` 2.x |
| Pruebas | Runner nativo de Node (`node --test`) con `tsx` |

---

3. Requisitos previos

- Node.js 18 o superior (probado con Node 26).
- npm 9 o superior.
- Una cuenta en [Supabase](https://supabase.com) con un proyecto creado.
- Para ejecutar en el teléfono: la app **Expo Go**; o un emulador
  Android/iOS si se quiere probar en nativo.

---

4. Instalación de dependencias

```bash
npm install
```

Las dependencias se fijaron con `npx expo install <paquete>` para que las
versiones sean compatibles con el SDK 54. Si añades una librería nativa nueva,
vuelve a usar ese comando en lugar de `npm install <paquete>`.

---

5. Configuración de `.env`

Copia el archivo de ejemplo y completa los valores:

```bash
copy .env.example .env      # Windows
cp .env.example .env        # macOS / Linux
```



Dónde encontrar cada valor: **Supabase → Project Settings → API**.

- `EXPO_PUBLIC_SUPABASE_URL` → *Project URL*.
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` → *Publishable key* (antes
  `anon public key`). También se acepta el nombre legacy
  `EXPO_PUBLIC_SUPABASE_ANON_KEY` si tu proyecto ya lo usaba.

Después de editar `.env`, **reinicia el servidor con caché limpia**:

```bash
npx expo start -c
```

### Advertencias de seguridad

- **Nunca** uses la clave `service_role` ni una *secret key* en esta aplicación.
  Los valores `EXPO_PUBLIC_*` se incrustan en el bundle en texto plano: eso es
  intencional en una app móvil y **no** los convierte en secretos. Lo que
  protege los datos es **RLS**, no la ofuscación de la clave.
- Nunca subas `.env` al repositorio. Ya está en `.gitignore`, junto con
  `.env.local` y `.env.*.local`.
- Las credenciales de este proyecto no deben mezclarse con las de otro
  proyecto de Supabase.
- La app **no imprime las claves en consola**. Si faltan las variables, muestra
  una pantalla de error explicando qué configurar, en vez de fallar en blanco.

---

## 6. Ejecutar la aplicación

```bash
npx expo start
```

Luego:

- **Android físico / emulador**: pulsa `a` en la terminal, o `npm run android`.
- **iOS**: pulsa `i`, o `npm run ios`.
- **Expo Go**: escanea el QR con la app Expo Go.
- **Web**: pulsa `w`, o `npm run web`.

Otros comandos:

```bash
npm run lint        # ESLint (eslint-config-expo)
npm run typecheck   # tsc --noEmit
npm test            # ejecuta typecheck y luego las pruebas unitarias
```

---

## 7. Creación de la tabla `libros` y RLS

El script está en **`supabase/migrations/001_libros.sql`**. Define la tabla,
activa RLS, quita los permisos por defecto y concede explícitamente lo
necesario al rol `authenticated`.

### Cómo ejecutarlo

No tengo acceso a tu cuenta de Supabase, así que **tienes que aplicarlo tú**.
Tienes dos opciones:

**Opción A — SQL Editor (recomendada, en el navegador)**

1. Entra en <https://supabase.com/dashboard> y abre tu proyecto.
2. Ve a **SQL Editor → New query**.
3. Abre `supabase/migrations/001_libros.sql`, copia todo su contenido y pégalo.
4. Pulsa **Run**.

**Opción B — Supabase CLI**

```bash
npm install -g supabase
supabase login
supabase link --project-ref <tu-project-ref>
supabase db push            # o: supabase db execute --file supabase/migrations/001_libros.sql
```

El script es idempotente respecto a políticas y tabla (`IF NOT EXISTS` /
`DROP POLICY IF EXISTS`), así que puedes volver a ejecutarlo sin romper nada.

### Qué hace exactamente

```sql
CREATE TABLE IF NOT EXISTS public.libros (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  titulo TEXT NOT NULL,
  autor TEXT NOT NULL,
  anio INTEGER NOT NULL,
  CONSTRAINT libros_titulo_valido CHECK (length(btrim(titulo)) > 0),
  CONSTRAINT libros_autor_valido CHECK (length(btrim(autor)) > 0),
  CONSTRAINT libros_anio_valido CHECK (anio BETWEEN 1 AND 2100)
);
```

- Las **columnas son exactamente** `id`, `titulo`, `autor`, `anio`. No hay
  `user_id`, ni `created_at`, ni `isbn`, ni `genero`, ni `descripcion`.
- `id` lo genera PostgreSQL (`GENERATED BY DEFAULT AS IDENTITY`).
- Las tres columnas obligatorias no pueden quedar vacías tras `btrim`.
- El año debe estar entre **1 y 2100**.

---

## 8. GRANT y RLS en detalle

### Cómo funciona la seguridad

Mis Libros utiliza **Supabase Auth** para identificar al usuario mediante correo
y contraseña. Cuando una sesión está activa, Supabase envía el token de
autenticación en las solicitudes a la base de datos. PostgreSQL reconoce esas
solicitudes mediante el rol **`authenticated`**. Los permisos **GRANT** permiten
consultar, insertar y eliminar libros, mientras que las políticas **RLS**
autorizan esas operaciones sobre la tabla. Los usuarios sin autenticación no
cuentan con estos permisos.

En concreto:

```sql
-- RLS activado: PostgreSQL filtra cada fila según la política.
ALTER TABLE public.libros ENABLE ROW LEVEL SECURITY;

-- Se revocan TODOS los permisos por defecto (incluido el acceso de anon).
REVOKE ALL ON TABLE public.libros FROM PUBLIC, anon, authenticated;

-- El rol autenticado sí puede usar el esquema y operar sobre la tabla.
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.libros TO authenticated;

-- Una política por operación.
CREATE POLICY "libros_select_authenticated" ON public.libros
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "libros_insert_authenticated" ON public.libros
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "libros_delete_authenticated" ON public.libros
  FOR DELETE TO authenticated USING (true);
```

### Reglas que se respetaron

- **RLS nunca se deshabilita.** Es la frontera de autorización real; ocultar un
  botón en la interfaz es solo cortesía.
- **No hay políticas permisivas para `anon`.** El rol anónimo queda sin permisos
  de tabla, así que un cliente sin sesión no puede leer, insertar ni eliminar.
- **No hay restricciones por propietario**, porque el esquema no tiene
  `user_id`. `USING (true)` es correcto *aquí*: la biblioteca es compartida.
- **No se usan secretos administrativos en el cliente móvil.** Si una operación
  que debería fallar tiene éxito, el problema está en el SQL, no en el cliente.
- **No se agrega política de UPDATE** en esta versión, porque la aplicación no
  ofrece edición de libros. Si se añade en el futuro, hay que extender el SQL
  con `GRANT UPDATE` y una política `FOR UPDATE`; **no** se debe cambiar el
  alcance SQL por cuenta propia.
- **No se ejecutan migraciones destructivas automáticamente.** El script se
  aplica a mano y no borra datos.

---

## 9. Funcionamiento del registro

1. El usuario sin sesión ve la pantalla **Iniciar sesión** y pulsa *Crear cuenta*.
2. `AuthService.registrar()` valida el correo y la contraseña (mínimo 6
   caracteres) antes de llamar a `supabase.auth.signUp({ email, password })`.
3. El formulario pide **confirmar la contraseña** y bloquea el botón mientras la
   petición está en curso, para evitar registros duplicados.
4. **Registrarse no implica iniciar sesión.** Si el proyecto tiene activada la
   confirmación por correo, `signUp` devuelve `session: null` y la app informa
   *"revisa tu correo y confirma el enlace"*. Si la confirmación está
   desactivada, Supabase devuelve una sesión y el guard de navegación lleva a
   Home por su cuenta.
5. Los errores se traducen a mensajes comprensibles (`usuario ya existe`,
   `correo inválido`, `contraseña débil`…). Nunca se muestra el texto crudo de
   Supabase.

---

## 10. Funcionamiento del inicio de sesión

1. `AuthService.iniciarSesion()` valida los campos y llama a
   `supabase.auth.signInWithPassword({ email, password })`.
2. Credenciales incorrectas → `"Correo o contraseña incorrectos."`; la app
   **no** navega a Home.
3. **No hay ninguna navegación manual a Home.** Cuando Supabase confirma la
   sesión, `onAuthStateChange` actualiza `AuthContext`, `isAuthenticated` pasa a
   `true`, y `Stack.Protected` habilita el grupo `(app)`. La navegación depende
   del **estado de la sesión**, no del resultado de la llamada.

---

## 11. Funcionamiento del cierre de sesión

1. El botón **Salir** (en el encabezado de Home) pide confirmación visual.
2. Llama a `AuthService.cerrarSesion()`, que ejecuta `supabase.auth.signOut()`.
   **No es un cierre simulado.**
3. Supabase emite el cambio por `onAuthStateChange`; el contexto pone
   `isAuthenticated = false`.
4. `Stack.Protected` deshabilita `(app)` y habilita `(auth)`, y el usuario vuelve
   a la pantalla de Login. No queda acceso residual a pantallas privadas.

---

## 12. Restauración de la sesión

- El cliente se crea con `persistSession: true`, `autoRefreshToken: true` y
  `detectSessionInUrl: false`, usando **AsyncStorage** como almacenamiento.
- Al abrir la app, `AuthContext` llama a `AuthService.obtenerSesion()`
  (`getSession()`, que lee de AsyncStorage). **Hasta que esa comprobación
  termina, `isLoading` sigue en `true`** y se muestra una pantalla de carga: no
  se asume que la sesión ya está restaurada.
- Un **único** listener `onAuthStateChange` mantiene el estado al día (incluidos
  los refrescos de token) y se desuscribe al desmontar. El callback no hace
  `await`, porque supabase-js puede entrar en deadlock con eso.
- `AsyncStorage` es obligatorio: sin `storage`, `persistSession` no funciona en
  nativo y la sesión moriría en cada reinicio.

---

## 13. Navegación basada en la sesión

Flujo: **SIN SESIÓN → LOGIN → (login correcto) → HOME → (cerrar sesión) → LOGIN**

La navegación no es condicional dentro de una pantalla: se resuelve en el
layout raíz con los grupos de Expo Router.

```
src/app/
├── _layout.tsx          ← AuthProvider + Stack.Protected (decide qué grupo existe)
├── (auth)/
│   ├── _layout.tsx
│   ├── login.tsx        ← ruta pública, se declara primera: es el anclaje
│   └── register.tsx
└── (app)/
    ├── _layout.tsx
    ├── index.tsx        ← "/" listado + formulario (solo con sesión)
    └── libro/[id].tsx   ← detalle (solo con sesión)
```

`src/app/_layout.tsx`:

```tsx
<Stack.Protected guard={isAuthenticated}>
  <Stack.Screen name="(app)" />
</Stack.Protected>
<Stack.Protected guard={!isAuthenticated}>
  <Stack.Screen name="(auth)" />
</Stack.Protected>
```

Mientras `isLoading` es `true` se renderiza la pantalla de carga y **ninguna**
ruta protegida es accesible. No se usa un segundo navegador ni una segunda
biblioteca de navegación: el proyecto usa Expo Router, y así se mantiene.

> `login` se declara primero en `(auth)/_layout.tsx` a propósito: es la pantalla
> a la que Expo Router lleva al usuario sin sesión. Reordenar ese layout cambia
> el punto de entrada.

---

## 14. `LibroRepository`

`src/repositories/LibroRepository.ts`

Es la capa que habla con la base de datos. **Conserva el patrón Singleton de la
tarea anterior**: el constructor es privado y la instancia se obtiene solo con
`getInstance()`. Lo que cambia es que ya no mantiene un arreglo en memoria,
sino que consulta `public.libros`.

| Método | Antes | Ahora |
| --- | --- | --- |
| `obtenerLibros()` | síncrono, devolvía el Mock | `Promise<Libro[]>`, consulta Supabase ordenada por `id` descendente |
| `agregarLibro(libro)` | síncrono, `push` al Mock | `Promise<Libro>`, valida, inserta y devuelve el registro creado |
| `eliminarLibro(id)` | síncrono, filtraba el Mock | `Promise<void>`, ejecuta el `DELETE` en Supabase |

Consultas utilizadas:

```ts
// Obtener
supabase.from('libros')
  .select('id, titulo, autor, anio')
  .order('id', { ascending: false });

// Agregar
supabase.from('libros')
  .insert({ titulo, autor, anio })
  .select('id, titulo, autor, anio')
  .single();

// Eliminar
supabase.from('libros').delete().eq('id', id);
```

Detalles importantes:

- **El mapeo es explícito**: `Libro.desdeFila(fila)` convierte la fila de
  PostgREST en el modelo de dominio, de modo que un cambio en el SQL falla de
  forma visible y no silenciosa.
- **Los errores nunca se convierten en datos.** Si Supabase falla, la promesa se
  rechaza con `LibroRepositoryError` y un mensaje ya traducido. Devolver una
  lista vacía o datos Mock ocultaría el fallo y haría creer al usuario que la
  biblioteca está vacía.
- **Anti doble envío**: `FormularioLibro` deshabilita el botón mientras la
  inserción está en curso.
- **No se eliminan registros de la vista si Supabase reportó un error**: la lista
  solo se recarga tras un `DELETE` confirmado.
- Los datos Mock **ya no alimentan la aplicación**. No hay fixtures de prueba
  insertados en Supabase al iniciar.

`LibroService` (`src/services/LibroService.ts`) se conserva como fachada y
sigue delegando en el repositorio, manteniendo los nombres públicos
`obtenerLibros`, `agregarLibro` y `eliminarLibro`. La instancia única del
servicio es `libroService`.

---

## 15. `AuthService`

`src/services/AuthService.ts`

Centraliza **todas** las llamadas a `supabase.auth`; ninguna pantalla las hace
directamente. Métodos:

| Método | Qué hace |
| --- | --- |
| `registrar(email, password)` | Valida y llama a `signUp`. Devuelve si hay sesión activa o si hace falta confirmar el correo. |
| `iniciarSesion(email, password)` | Valida y llama a `signInWithPassword`. Devuelve el `User`. |
| `cerrarSesion()` | Llama a `signOut()`. |
| `obtenerSesion()` | `getSession()`: sesión guardada en AsyncStorage, o `null`. |
| `obtenerUsuario()` | Usuario de la sesión actual, o `null`. |
| `escucharCambiosSesion(callback)` | Registra `onAuthStateChange` y devuelve la función de *unsubscribe*. |

`AuthContext` (`src/contexts/AuthContext.tsx`) expone el estado global que consume
la navegación: `isLoading`, `isAuthenticated`, `user`, `session`, `errorConfig`,
`registrar`, `iniciarSesion`, `cerrarSesion` y `refrescarSesion`. Se consume con
el hook `useAuth()` (`src/hooks/useAuth.ts`).

---

## 16. Estructura del proyecto

```text
src/
├── app/                       ← rutas de Expo Router (cada archivo es una pantalla)
│   ├── _layout.tsx            ← AuthProvider + Stack.Protected
│   ├── (auth)/                ← públicas: login, register
│   └── (app)/                 ← privadas: index, libro/[id]
├── components/
│   ├── Dialogo.tsx            (confirmaciones con Modal)
│   ├── EncabezadoApp.tsx      ← botón "Salir" del encabezado
│   ├── FormularioLibro.tsx    ← alta (anti doble envío)
│   ├── MensajeError.tsx       ← error / éxito / aviso
│   ├── PantallaCarga.tsx      ← restauración de sesión
│   ├── PantallaErrorConfig.tsx← falta de .env
│   └── TarjetaLibro.tsx       ← tarjeta del listado
├── constants/estilos.ts       ← colores y espaciados (identidad de Mis Libros)
├── contexts/AuthContext.tsx   ← estado global de autenticación
├── hooks/useAuth.ts
├── lib/
│   ├── errores.ts             ← traducción de errores Supabase/Postgres
│   ├── supabase.ts            ← cliente único + validación de .env
│   ├── validacion.ts          ← validaciones puras (reflejan los CHECK)
│   ├── errores.test.ts
│   └── validacion.test.ts
├── models/Libro.ts            ← modelo de dominio (clase, de la tarea anterior)
├── repositories/LibroRepository.ts  ← Singleton + acceso a public.libros
├── services/
│   ├── AuthService.ts
│   └── LibroService.ts
└── types/database.types.ts    ← contrato de la tabla libros

supabase/migrations/001_libros.sql
docs/tarea-anterior/           ← App.tsx y README de la versión previa (referencia)
```

---

## 17. Pruebas realizadas

### Pruebas automatizadas (ejecutadas y **PASS**)

```bash
npm run typecheck   # tsc --noEmit → 0 errores
npm test            # pretest (typecheck) + pruebas unitarias
npx expo lint       # ESLint → 0 errores, 0 warnings
```

Las pruebas unitarias cubren `validacion.ts` (25 casos) y `errores.ts`
(traducción de mensajes). Resultado real de la última ejecución:

```text
ℹ tests 25
ℹ pass 25
ℹ fail 0
```

También se verificó que el proyecto **compila de verdad** con Metro, sin errores
de bundling, en ambas plataformas:

```bash
npx expo export --platform web     # ✔ 762 módulos, bundle generado
npx expo export --platform android # ✔ bundle generado
```

### Cobertura frente al enunciado

| Verificación | Estado |
| --- | --- |
| Tabla `libros` con `id`, `titulo`, `autor`, `anio` | Verificado en el SQL y en los tipos |
| Textos vacíos y años fuera de 1–2100 se rechazan | **PASS** (pruebas unitarias). El rechazo en Supabase depende de aplicar el script |
| Sin sesión se muestra Login | Verificado en el código (`Stack.Protected`) |
| Con sesión se muestra Home | Verificado en el código (`Stack.Protected`) |
| No hay redirección manual a Home | Verificado: `login.tsx` no llama a `router` |
| Cerrar sesión vuelve al flujo público | Verificado: `signOut` → `onAuthStateChange` → guard |
| TypeScript, lint y bundle sin errores | **PASS** |
| Consultar / insertar / eliminar contra Supabase real | **NO EJECUTADO** |
| RLS con y sin sesión en Supabase real | **NO EJECUTADO** |
| Sesión persistente tras reiniciar la app | **NO EJECUTADO** |

### Limitaciones conocidas

- **No se ejecutaron operaciones contra un proyecto real de Supabase**, porque
  no hay credenciales de un proyecto para esta tarea. Por eso las filas
  marcadas como **NO EJECUTADO** lo están: no se afirma que funcionen, solo que
  el código está preparado y revisado. Los pasos pendientes están en la sección
  siguiente.
- La app no crea la tabla ni aplica el SQL: eso es manual (sección 7).
- No se wipea la `cache` de Metro al cambiar `.env` salvo que se use `-c`.
- No hay edición de libros, así que no hay política `UPDATE`. Si se agrega esa
  funcionalidad hay que extender el SQL explícitamente.
- La biblioteca es compartida: **cualquier usuario autenticado puede eliminar el
  libro de otro**. Es el comportamiento pedido para esta versión; en un
  proyecto real convendría owned-by o una tabla de membresías.
- El cierre de sesión requiere confirmación visual con `Alert`, que en web
  tiene un comportamiento distinto al de nativo.
- El cierre de sesión requiere confirmación visual con `Dialogo` (Modal), que
  funciona igual en web, Android e iOS.
- **`Alert.alert` no funciona en web.** En `react-native-web` la clase `Alert`
  es un stub vacío (`static alert() {}`): acepta los argumentos y no hace nada,
  así que el diálogo nunca aparece y el `onPress` de sus botones nunca se
  dispara. Por eso **todas** las confirmaciones de esta app usan el componente
  `Dialogo`, construido sobre `Modal`, que sí está implementado en web,
  Android e iOS. Si añades una confirmación nueva, usa `Dialogo` y no `Alert`.
  Esta restricción también aplica a `Share`, `Vibration` y similares.

---

## 18. Pasos manuales pendientes

1. Crear el proyecto en Supabase y copiar su `.env` siguiendo la sección 5.
2. Ejecutar `supabase/migrations/001_libros.sql` en el **SQL Editor** (sección 7).
3. `npx expo start -c`.
4. Registrar un usuario. Si pide confirmación de correo, confirmar el enlace.
5. Iniciar sesión y comprobar que Home carga la lista desde Supabase.
6. Agregar un libro y verificar que aparece en Supabase → **Table Editor →
   libros**.
7. Probar la rejection de datos inválidos: intentar guardar sin título, o con
   año `0` o `2101`. Debe mostrar el error de validación.
8. Eliminar un libro y confirmar que la fila desaparece en Table Editor.
9. Cerrar sesión y comprobar que se vuelve a la pantalla de Login.
10. Cerrar por completo la app y volver a abrirla: la sesión debe seguir activa
    (persistencia en AsyncStorage).
11. **Prueba de RLS**: con la sesión cerrada, desde Supabase → **Table Editor**,
    o con un cliente HTTP sin token (`curl` sin header `apikey`/`Authorization`),
    verificar que `SELECT` sobre `libros` es rechazado. Opcionalmente, desde el
    navegador sin sesión contra la API REST de PostgREST.
12. Crear un segundo usuario y comprobar que **ve la misma biblioteca**.

---

## 19. Créditos

Continuación del proyecto **Mis Libros** de las tareas anteriores de
Programación II (modelo de datos, patrón Repository y Singleton). La versión
actual añade Supabase (base de datos + Auth + RLS) y la navegación por sesión.