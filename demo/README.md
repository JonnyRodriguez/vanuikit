# VanUI Demo

Demo de la libreria **vanui**, consumida como paquete real
(`"vanui": "file:../vanui"` en `package.json`).

SPA de pagina unica inspirada en `store/web`: un router cliente
(`router.ts`) registra rutas declarativas (`router.add(path, () => Component)`).
`App` (`app.ts`) es solo el shell: título + Nav compartido + la pantalla que
resuelve el router. Cada pantalla es dueña de sus propios datos y estado.
Todo el JS se empaqueta en un único bundle (`dist/main.js`) servido desde
`index.html`.

## Rutas

| Ruta           | Pantalla                                    |
|----------------|---------------------------------------------|
| `/`            | redirige a `/***REMOVED***`                      |
| `/***REMOVED***`    | flujo de ***REMOVED*** (lista de ***REMOVED***s → modal monto → QR) |
| `/login`       | formulario de login (fetch a `/api/auth/login`) |
| `/register`    | formulario de registro (fetch a `/api/auth/register`) |
| `/components`  | catálogo: botones, campos, modal, spin      |

## Estructura

    ├── router.ts          <- Router SPA (store/web pattern: pushState, popstate, link interception)
    ├── app.ts             <- shell: título + Nav global + registro de rutas
    ├── main.ts            <- entry point SPA (monta App() en #app)
    ├── index.html         <- única página: <div id="app"> + <script src="./dist/main.js">
    ├── demo.css           <- reset + shell (título .demo-title, clase .page)
    ├── screens/
    │   ├── ***REMOVED***-screen.ts   <- pantalla principal: carga sus datos + ***REMOVED***List + Modal interno
    │   ├── login-screen.ts      <- pantalla login: LoginForm
    │   ├── register-screen.ts   <- pantalla registro: RegisterForm
    │   ├── components-screen.ts <- catálogo: todos los componentes
    │   ├── ***REMOVED***-module.ts   <- referencia (mantenido, noSPA)
    │   ├── ***REMOVED***.ts          <- pantallas de monto/QR (usadas por ***REMOVED***-screen)
    │   ├── ***REMOVED***.ts          <- composición de ***REMOVED***s (usada por ***REMOVED***-screen)
    │   └── qr.ts                <- wrapper de qr-code-styling
    ├── server/                <- backend Hono (patrón store: controllers + repositories + data)
    │   ├── index.ts           <- entry: CORS + createApiRouter + /api + serveStatic
    │   ├── apiRouter.ts       <- escáner dinámico de *.controller.ts
    │   ├── controllers/
    │   │   ├── auth.controller.ts     <- router Hono: POST /login, /register (lógica inline)
    │   │   └── ***REMOVED***.controller.ts  <- router Hono: GET /***REMOVED***, /params, POST /***REMOVED***
    │   ├── repositories/
    │   │   ├── user.repository.ts    <- acceso a datos de usuarios (const object, sin clases)
    │   │   └── ***REMOVED***.repository.ts <- acceso a datos de transactions (const object, sin clases)
    │   ├── data/
    │   │   └── index.ts              <- datos mock (***REMOVED***, params, usuarios)
    │   └── types.ts                  <- DTOs compartidos
    ├── img/***REMOVED***/           <- imágenes de las ***REMOVED***s
    ├── scripts/uno.js         <- compila las clses de la demo a dist/uno.css
    └── dist/                  <- build: bundles + vanui.css + uno.css

## Comandos (Bun)

    bun install        # instala dependencias (vanui, hono, zod, qr-code-styling, @unocss/*, typescript)
    bun run typecheck  # tsc --noEmit (screens .ts + *.ts entry + server/)
    bun run build      # empaqueta SPA en dist/main.js + vanui.css + uno.css
    bun run dev        # inicia el servidor Hono en http://localhost:3000
    bun run demo       # alias de dev

## Backend (Hono + controllers estilo store)

Patrón idéntico a `store/api/src`: cada `{resource}.controller.ts` en
`server/controllers/` define un sub-router Hono con sus rutas y la lógica
inline (como `auth.controller.ts` del store). El `apiRouter.ts` escanea el
directorio y los monta automáticamente bajo `/api/{resource}`.

Igual al `../store/api/src/apiRouter.ts`:

    auth.controller.ts     ->  /api/auth/login, /api/auth/register
    ***REMOVED***.controller.ts  ->  /api/***REMOVED***/***REMOVED***, /api/***REMOVED***/params, /api/***REMOVED***/***REMOVED***

### Arquitectura

1. **apiRouter.ts** — escanea `server/controllers/` dinámicamente, monta cada
   `*.controller.ts` como sub-router en `/{resourceName}`. Los controladores
   exportan un `new Hono()` con sus rutas (no clases PHP, sino instancias
   Hono que agrupan acciones por recurso).

2. **Controllers** — cada archivo crea un `Hono()`, define rutas con Zod
   validation y la lógica de negocio inline (como el store), y lo exporta
   como `default`. Las rutas son relativas al controlador:
   `auth.post("/login", ...)`.

3. **Repositories** — acceso a datos como objetos const con métodos (mismo
   patrón que `store/api/src/repositories/user.repository.ts`), NUNCA clases:
   `UserRepository.findForAuth(email)` o `***REMOVED***Repository.getParams()`.
   Aquí se leen/escriben los fixtures de `data/`.

4. **Data** — fixtures en memoria (equivalente a seeders de PHP):
   ***REMOVED***, params, usuarios.

### Endpoints

| Metodo | Ruta                         | Controlador       | Acción     |
|--------|------------------------------|-------------------|------------|
| POST   | `/api/auth/login`            | `auth.controller` | login      |
| POST   | `/api/auth/register`         | `auth.controller` | register   |
| GET    | `/api/***REMOVED***/***REMOVED***`      | `***REMOVED***.controller` | ***REMOVED*** |
| GET    | `/api/***REMOVED***/params`        | `***REMOVED***.controller` | params   |
| POST   | `/api/***REMOVED***/***REMOVED***`      | `***REMOVED***.controller` | ***REMOVED*** |
| GET    | `/health`                    | —                 | —          |

### Formato de respuesta (igual al store)

Éxito: `{ status: "ok" }` o `{ status: "ok", data: {...} }`
Error: `{ error: "mensaje" }` (400, 401, 409)
Validación: `{ error: "Datos invalidos", details: {...} }` (400)

## SPA (frontend)

Patrón store/web: un único `index.html` con `<div id="app">`. El router
cliente (`router.ts`) resuelve rutas con pushState/popstate e intercepción
de clicks. `app.ts` renderiza el shell (título + Nav compartido, reactivo a
`router.path`) y registra las rutas; `main.ts` monta `App()` al cargar el DOM.

## CSS

Dos hojas, una por cada origen:

- **`dist/vanui.css`** — hoja del paquete (reset, tema `--vui-*`, utilidades de componentes).
- **`dist/uno.css`** — utilidades de la demo, generadas con UnoCSS.

## Flujo de ***REMOVED***

`***REMOVED***Screen` es dueña de sus datos: al montarse fetch-kea ***REMOVED***s y
parámetros desde `/api/***REMOVED***/***REMOVED***` y `/api/***REMOVED***/params` en un estado
reactivo propio (spinner mientras carga). Al seleccionar una ***REMOVED***, se
abre un modal con el formulario de monto; al enviarlo, `handleSubmit` POSTea
a `/api/***REMOVED***/***REMOVED***` y muestra el QR generado. El backend valida el
monto contra los límites configurados y devuelve la URL de la plataforma.
