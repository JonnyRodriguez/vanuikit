# Server (`vanuikit/server`)

Server-side helpers live in the `vanuikit/server` subpath export and run on
[Hono](https://hono.dev). They are optional — only import them if you use a
Hono backend.

```ts
import { loadRoutes, createAuthRoutes, MemorySessionStore } from "vanuikit/server";
```

---

## Session store

A `SessionStore` abstracts session persistence:

```ts
interface SessionStore<TUser extends BaseUser> {
  create(user: TUser, ttlSeconds?: number): PromiseOrValue<Session<TUser>>;
  get(token: string): PromiseOrValue<Session<TUser> | null>;
  delete(token: string): PromiseOrValue<boolean>;
  deleteByUser(userId: string | number): PromiseOrValue<number>;
  cleanExpired?(): PromiseOrValue<number>;
}
```

`MemorySessionStore` is an in-memory implementation (TTL defaults to 86400s).
For production, implement `SessionStore` backed by your database/Redis.

---

## `createAuthRoutes(options)`

Builds a Hono sub-app with session endpoints. `options`:

| Option | Type | Default | Description |
|---|---|---|---|
| `sessionStore` | `SessionStore` | — | Required. Session store. |
| `cookieName` | `string` | `"session_token"` | Cookie name. |
| `cookieOptions` | `CookieConfig` | — | `path`, `httpOnly`, `secure`, `sameSite`. |
| `onLogin` | `(credentials, c) => Promise<TUser \| null>` | — | Required. Validates credentials, returns user or `null`. |
| `onRegister?` | `(data, c) => Promise<TUser \| { error, status? }>` | — | Register handler. |
| `onLogout?` | `(token, c) => Promise<void>` | — | Hook after session deletion. |
| `serializeUser?` | `(user) => any` | identity | What is returned to the client. |

---

## `createAuthMiddleware(options)`

Hono middleware that authenticates a request from the `Authorization: Bearer`
header **or** the session cookie. Adds `c.get("user")` and `c.get("session")`
when valid; returns `401` otherwise. Options: `sessionStore`, `cookieName`
(default `"session_token"`), `unauthorizedMessage`.

---

## `loadRoutes(dir, options)` — deny-by-default

Recursively scans `*.route.ts|js` files in `dir` and mounts each Hono sub-app
following the folder hierarchy:

```
routes/api/auth.route.ts     ->  /api/auth
routes/api/***REMOVED***.route.ts  ->  /api/***REMOVED***
```

`options`:

| Option | Type | Description |
|---|---|---|
| `auth` | `MiddlewareHandler` | If provided, **every** file is protected with it unless the file opts out. |
| `onLoad` | `(info: LoadedRouteInfo) => void` | Callback per loaded route (`info = { path, file, protected }`). |

**Security model:** with `auth` set, a route is protected by default. Only an
explicit opt-out makes it public:

```ts
// routes/docs.route.ts
export const meta = { public: true }; // explicit opt-out
export default new Hono().get("/", (c) => c.text("Public docs"));
```

The dangerous error (forgetting to protect a route) becomes impossible; the
only possible mistake is the harmless opposite (a route that should be public
asks for login, visible instantly).

### Example

```ts
import { Hono } from "hono";
import { loadRoutes, createAuthRoutes, MemorySessionStore } from "vanuikit/server";

const app = new Hono();
const sessionStore = new MemorySessionStore();

// Auth sub-app (login/register/logout/me)
app.route("/auth", createAuthRoutes({
  sessionStore,
  onLogin: async (credentials) => {
    const user = await verifyCredentials(credentials.email, credentials.password);
    return user; // or null if invalid
  },
}));

// Everything else is protected by default
app.route("/", await loadRoutes("./routes", {
  auth: createAuthMiddleware({ sessionStore }),
  onLoad: (info) => console.log(info.method ?? "", info.path, info.protected ? "🔒" : "🌐"),
}));

export default app;
```
