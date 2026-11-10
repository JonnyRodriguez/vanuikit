# VanUikit Demo

Demo of the **vanuikit** library, consumed as a real package (`"vanuikit": "file:../vanuikit"` in `package.json`).

Single-page application (SPA) built with VanJS: a client router (`router.ts`) registers declarative routes (`router.add(path, () => Component)`). `App` (`app.ts`) is the main shell with a shared header and navigation (`Header`), and reactively mounts the page resolved by the router.

## Routes

| Route           | View / Page | Description |
|----------------|---------------------------------------------|-------------|
| `/`            | redirects to `/dashboard`                     | Default redirect |
| `/dashboard`   | `DashboardPage`                             | Protected view: fetches `/api/auth/me` (client route + server-protected data) |
| `/login`       | `LoginPage`                                 | Sign in with validation and redirect |
| `/register`    | `RegisterPage`                              | User registration with typed validation |
| `/components`  | `ComponentsPage`                            | Interactive catalog of VanUikit components |
| `/debug`       | `DebugPage`                                 | Reactivity dependency graph and diagnostics (only with `van-debug=1` or `?van-debug`) |

## Demo Structure

```text
demo/
├── app.ts                 <- Global shell: SPA router, auth, shared i18n and theme
├── main.ts                <- Client entry point (mounts App() on #app)
├── index.html             <- Base HTML with container and bundled script
├── demo.css               <- Theme variables and base styles
├── pages/                 <- Complete application views (SPA pages)
│   ├── dashboard.page.ts  <- Protected dashboard (consumes /api/auth/me)
│   ├── login.page.ts      <- Sign-in page
│   ├── register.page.ts   <- Account creation page
│   ├── components.page.ts <- Component catalog and sandbox
│   └── debug.page.ts      <- Van dependency graph (debug mode)
├── server/                <- Modular Hono backend
│   ├── index.ts           <- HTTP server, CORS middleware, and static files
│   ├── router.loader.ts   <- Dynamic route loader (/api/*)
│   ├── routes/            <- HTTP endpoint definitions
│   ├── actions/           <- Business logic and schema validation (Zod)
│   ├── repositories/      <- In-memory data access
│   ├── data/              <- Initial fixtures (users)
│   └── types.ts           <- Backend DTOs and types
├── shared/                <- Shared Zod validation schemas (client/server)
└── dist/                  <- Compiled output (main.js, vanuikit.css, uno.css)
```

## Commands

```bash
bun install        # Installs dependencies
bun run lint       # Type validation with tsc --noEmit
bun run build      # Builds vanuikit, the demo, and UnoCSS styles
bun run dev        # Starts the dev server at http://localhost:3000
bun test           # Runs the unit test suite
```

## Backend (Hono)

The backend exposes a REST API organized in layers:
- **`routes/`**: Defines the HTTP endpoints (`POST /api/auth/login`, `GET /api/auth/me`, etc.); by default every route is protected (`requireAuth`).
- **`actions/`**: Orchestrates input validation with Zod and calls the repositories.
- **`repositories/`**: Manages data access and persistence (users).
- **`data/`**: Initial in-memory fixtures.

### Main endpoints

| Method | Route | Controller / Action |
|--------|------|----------------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | User registration |
| GET | `/api/auth/me` | Current session user (protected) |
| GET | `/health` | Server health check |
