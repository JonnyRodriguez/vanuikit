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
| `/`            | redirige a `/gateways`                      |
| `/gateways`    | flujo de recarga (lista de pasarelas → modal monto → QR) |
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
    │   ├── gateways-screen.ts   <- pantalla principal: carga sus datos + GatewaysList + Modal interno
    │   ├── login-screen.ts      <- pantalla login: LoginForm
    │   ├── register-screen.ts   <- pantalla registro: RegisterForm
    │   ├── components-screen.ts <- catálogo: todos los componentes
    │   ├── recharge-module.ts   <- referencia (mantenido, noSPA)
    │   ├── recharge.ts          <- pantallas de monto/QR (usadas por gateways-screen)
    │   ├── gateways.ts          <- composición de pasarelas (usada por gateways-screen)
    │   └── qr.ts                <- wrapper de qr-code-styling
    ├── server/                <- backend Hono (patrón store: controllers + repositories + data)
    │   ├── index.ts           <- entry: CORS + createApiRouter + /api + serveStatic
    │   ├── apiRouter.ts       <- escáner dinámico de *.controller.ts
    │   ├── controllers/
    │   │   ├── auth.controller.ts     <- router Hono: POST /login, /register (lógica inline)
    │   │   └── payment.controller.ts  <- router Hono: GET /gateways, /params, POST /recharge
    │   ├── repositories/
    │   │   ├── user.repository.ts    <- acceso a datos de usuarios (const object, sin clases)
    │   │   └── payment.repository.ts <- acceso a datos de pagos (const object, sin clases)
    │   ├── data/
    │   │   └── index.ts              <- datos mock (gateways, params, usuarios)
    │   └── types.ts                  <- DTOs compartidos
    ├── img/payment/           <- imágenes de las pasarelas
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
    payment.controller.ts  ->  /api/payment/gateways, /api/payment/params, /api/payment/recharge

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
   `UserRepository.findForAuth(email)` o `PaymentRepository.getParams()`.
   Aquí se leen/escriben los fixtures de `data/`.

4. **Data** — fixtures en memoria (equivalente a seeders de PHP):
   gateways, params, usuarios.

### Endpoints

| Metodo | Ruta                         | Controlador       | Acción     |
|--------|------------------------------|-------------------|------------|
| POST   | `/api/auth/login`            | `auth.controller` | login      |
| POST   | `/api/auth/register`         | `auth.controller` | register   |
| GET    | `/api/payment/gateways`      | `payment.controller` | gateways |
| GET    | `/api/payment/params`        | `payment.controller` | params   |
| POST   | `/api/payment/recharge`      | `payment.controller` | recharge |
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

## Flujo de recarga

`GatewaysScreen` es dueña de sus datos: al montarse fetch-kea pasarelas y
parámetros desde `/api/payment/gateways` y `/api/payment/params` en un estado
reactivo propio (spinner mientras carga). Al seleccionar una pasarela, se
abre un modal con el formulario de monto; al enviarlo, `handleSubmit` POSTea
a `/api/payment/recharge` y muestra el QR generado. El backend valida el
monto contra los límites configurados y devuelve la URL de la plataforma.
