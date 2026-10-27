# VanUI Demo

Demo de la librería **vanui**, consumida como paquete real (`"vanui": "file:../vanui"` en `package.json`).

SPA de página única construida con VanJS: un router cliente (`router.ts`) registra rutas declarativas (`router.add(path, () => Component)`). `App` (`app.ts`) es el shell principal con cabecera y navegación compartida (`Header`), y monta reactivamente la página resuelta por el router.

## Rutas

| Ruta           | Vista / Página                              | Descripción |
|----------------|---------------------------------------------|-------------|
| `/`            | redirige a `/gateways`                      | Redirección por defecto |
| `/gateways`    | `GatewaysPage`                              | Flujo de recarga (lista de pasarelas → modal de monto → QR) |
| `/login`       | `LoginPage`                                 | Inicio de sesión con validación y redirección |
| `/register`    | `RegisterPage`                              | Registro de usuario con validación tipada |
| `/components`  | `ComponentsPage`                            | Catálogo interactivo de componentes VanUI |

## Estructura de la Demo

```text
demo/
├── app.ts                 <- Shell global: Header común + Router SPA montado
├── main.ts                <- Entry point cliente (monta App() en #app)
├── index.html             <- HTML base con contenedor y script bundled
├── demo.css               <- Variables de tema y estilos base
├── pages/                 <- Vistas completas de la aplicación (páginas SPA)
│   ├── gateways.page.ts   <- Flujo de pasarelas y recargas
│   ├── login.page.ts      <- Página de inicio de sesión
│   ├── register.page.ts   <- Página de creación de cuenta
│   └── components.page.ts <- Catálogo y sandbox de componentes
├── components/            <- Componentes específicos de la demo
│   ├── header.component.ts        <- Barra de navegación superior con estado de auth
│   ├── gateways-list.component.ts <- Cuadrícula de métodos de pago

│   └── qr-generator.component.ts  <- Renderizado reactivo de código QR
├── server/                <- Backend Hono modular
│   ├── index.ts           <- Servidor HTTP, middleware CORS y archivos estáticos
│   ├── router.loader.ts   <- Cargador dinámico de rutas (/api/*)
│   ├── routes/            <- Definición de endpoints HTTP
│   ├── actions/           <- Lógica de negocio y validación de esquemas (Zod)
│   ├── repositories/      <- Acceso a datos en memoria
│   ├── data/              <- Fixtures iniciales (pasarelas, usuarios, parámetros)
│   └── types.ts           <- DTOs y tipos del backend
├── shared/                <- Esquemas de validación Zod compartidos (cliente/servidor)
├── img/payment/           <- Logos e isotipos de las pasarelas
└── dist/                  <- Salida compilada (main.js, vanui.css, uno.css)
```

## Comandos

```bash
bun install        # Instala dependencias
bun run lint       # Validación de tipos con tsc --noEmit
bun run build      # Compila vanui, la demo y los estilos UnoCSS
bun run dev        # Inicia el servidor de desarrollo en http://localhost:3000
bun test           # Ejecuta la suite de pruebas unitarias
```

## Backend (Hono)

El backend expone una API REST organizada por capas:
- **`routes/`**: Define los endpoints HTTP (`POST /api/auth/login`, `GET /api/payment/gateways`, etc.).
- **`actions/`**: Orquesta la validación de entrada con Zod y llama a los repositorios.
- **`repositories/`**: Gestiona el acceso y persistencia de datos (usuarios, pasarelas, recargas).
- **`data/`**: Fixtures iniciales en memoria.

### Endpoints principales

| Método | Ruta | Controlador / Acción |
|--------|------|----------------------|
| POST | `/api/auth/login` | Login de usuario |
| POST | `/api/auth/register` | Registro de usuario |
| GET | `/api/payment/gateways` | Lista de pasarelas activas |
| GET | `/api/payment/params` | Límites y tasas por divisa |
| POST | `/api/payment/recharge` | Creación de orden de recarga y datos QR |
| GET | `/health` | Chequeo de estado del servidor |

