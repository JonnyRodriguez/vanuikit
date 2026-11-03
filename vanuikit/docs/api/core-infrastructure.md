# Core infrastructure

This document covers the non-UI foundation of **VanUikit**: client-side session management (`createAuth`), the deny-by-default SPA router, reactive data helpers (`createQuery`/`createMutation`), field validators, the `cx` utility, the single-instance provenance helpers for VanJS, and the development-time reactivity tools (`trace`, `expectReactive`, `installVanDebug`). It also documents the server-side `vanuikit/server` entry, which ships Hono-based route loading, auth routes, and session stores.

All client APIs are re-exported from the `vanuikit` package; server APIs are imported from `vanuikit/server`.

## Client APIs

## `createAuth`

Creates the reactive auth/session state for the SPA. The app supplies an `AuthApi` (how it talks to the backend) and receives a reactive `AuthState` with helpers.

### Signature

```ts
createAuth(api: AuthApi, options?: AuthOptions): AuthState
```

### Options / Returns

`AuthOptions`:

| Option | Type | Default | Description |
|---|---|---|---|
| `storageKey` | `string \| null` | `"session_token"` | LocalStorage key used to persist the token. Pass `null` or `false` to disable persistence. |

See `AuthState` for the returned shape.

### Usage

```ts
import { createAuth } from "vanuikit";

const auth = createAuth({
  me: () => api<{ user: User | null }>("/auth/me"),
  login: (email, password) =>
    api<{ user: User }>("/auth/login", { method: "POST", body: { email, password } }),
  logout: () => api("/auth/logout", { method: "POST" }),
});

auth.boot().then(() => {
  // session verified; render the app
});
```

### Notes

- The token is persisted to `localStorage` AND sent as a cookie / `Authorization: Bearer` header for iframe and sandboxed compatibility.
- `register` throws if the provided `AuthApi` does not implement it.
- `boot()` is idempotent: concurrent calls share a single in-flight request.

## `requireAuth`

Returns a route `Guard` that protects a route. If there is no session, it redirects to `redirect` (default `/login`). If the initial session is still being verified (`idle`/`checking`), it first awaits `auth.boot()` to avoid false redirects on reload or direct URL access.

### Signature

```ts
requireAuth(
  auth: Pick<AuthState, "user"> & { status?: State<AuthStatus>; boot?: () => Promise<any> },
  redirect?: string = "/login",
): Guard
```

### Options / Returns

Returns a `Guard` (see Router). It resolves to `true` when a user is authenticated, or to `redirect` (a string) when not.

### Usage

```ts
import { createRouter, requireAuth } from "vanuikit";

const router = createRouter({
  guard: requireAuth(auth, "/login"),
  publicRoutes: ["/login", "/register", "/docs/*"],
});
```

### Notes

- Typically passed as the router-wide `guard` (deny-by-default) or as a per-route `beforeEnter`.
- Works with the `Router` `add(path, factory, { beforeEnter })` option too.

## `AuthUser`

The session user shape (defined by the app; the minimum is `id` + `email`).

### Signature

```ts
type AuthUser = {
  id: string | number;
  email: string;
  name?: string;
  [key: string]: unknown;
};
```

### Notes

- Open-ended: additional app-specific fields may be added via the index signature.

## `AuthApi`

The minimal contract the app implements against its backend.

### Signature

```ts
type AuthApi = {
  me: () => Promise<{ user: AuthUser | null; token?: string | null }>;
  login: (email: string, password: string) => Promise<{ user: AuthUser; token?: string | null }>;
  register?: (data: Record<string, unknown>) => Promise<{ user: AuthUser; token?: string | null }>;
  logout: () => Promise<void> | void;
};
```

### Notes

- `me()` verifies the current session and is called on startup (`boot`).
- `register` is optional; `createAuth().register` throws if it is absent.

## `AuthStatus`

The session verification status.

### Signature

```ts
type AuthStatus = "idle" | "checking" | "authenticated" | "unauthenticated";
```

### Notes

- `boot()` sets the status to `"checking"` while verifying.

## `AuthState`

The reactive session returned by `createAuth`.

### Signature

```ts
type AuthState = {
  user: State<AuthUser | null>;
  status: State<AuthStatus>;
  token: State<string | null>;
  boot: () => Promise<AuthUser | null>;
  login: (email: string, password: string) => Promise<{ user: AuthUser; token?: string | null }>;
  register: (data: Record<string, unknown>) => Promise<{ user: AuthUser; token?: string | null }>;
  logout: () => Promise<void>;
  setSession: (user: AuthUser | null, token?: string | null) => void;
  getToken: () => string | null;
  isAuthenticated: () => boolean;
};
```

### Options / Returns

The `user`, `status`, and `token` are reactive `State`s (from the `van` instance); the rest are plain methods.

### Usage

```ts
import { createAuth } from "vanuikit";

const auth = createAuth({ me, login, logout });
span(auth.user.val?.name ?? "Guest");
```

### Notes

- `setSession(user, token)` updates `user`/`status` and persists/clears the token.
- `getToken()` reads the state or falls back to the persisted localStorage token.

## `Router`

The SPA router class: dependency-free route matching (hand-written, no path-to-regexp), per-route guards, redirects, and a not-found factory.

### Signature

```ts
class Router {
  current: State<Node>;
  path: State<string>;
  constructor(options?: RouterOptions);
  add(path: string, factory: RouteFactory, options?: RouteOptions): this;
  redirect(from: string, to: string): this;
  setNotFound(factory: RouteFactory): this;
  navigate(path: string, options?: { replace?: boolean }): Promise<void>;
  resolve(): void;
  start(): () => Node;
}
```

### Options / Returns

`RouterOptions`:

| Option | Type | Description |
|---|---|---|
| `guard` | `Guard` | Default guard applied to every non-public route (deny-by-default). |
| `publicRoutes` | `(string \| RegExp)[]` | Routes exempt from `guard`: exact (`"/login"`), trailing wildcard (`"/docs/*"`), or RegExp. |

`RouteOptions`:

| Option | Type | Description |
|---|---|---|
| `beforeEnter` | `Guard` | Guard evaluated before rendering this route. |
| `afterEnter` | `(ctx: RouteContext) => void` | Runs after the route renders. |

`RouteContext` = `{ to: string; params: RouteParams; navigate: (path: string) => void }`.

Properties:

- `current` — reactive node of the current view; mount with `van.add(root, router.current)` or via `start()`.
- `path` — reactive current route path (used by `Nav` to highlight active links).

### Usage

```ts
import { Router, requireAuth } from "vanuikit";

const router = new Router({ guard: requireAuth(auth, "/login"), publicRoutes: ["/login"] });
router.add("/product/:id", ({ params }) => ProductScreen(params));
router.redirect("/", "/login");
router.setNotFound(() => NotFound());
router.start(); // installs popstate + click listeners, resolves initial route
```

### Notes

- Guards run in order: router-wide `guard` (if any and not public) first, then the route's `beforeEnter`.
- A guard returning a `string` redirects (replacing the history entry); returning `false` blocks navigation; `true`/nothing allows entry.
- `start()` installs global, unique listeners that delegate to the active router, so calling it on several instances (HMR, tests) does not accumulate competing handlers.

## `createRouter`

Factory to create a `Router`; also registers the new instance as the active router.

### Signature

```ts
createRouter(options?: RouterOptions): Router
```

### Options / Returns

Pass through to the `Router` constructor. Returns a `Router`.

### Usage

```ts
import { createRouter, requireAuth } from "vanuikit";

const router = createRouter({
  guard: requireAuth(auth, "/login"),
  publicRoutes: ["/login", "/docs/*"],
});
```

### Notes

- This is the preferred way to create the main router — it sets the active router so `navigate` works globally.

## `navigate`

Global navigation function. Uses the active router (if one is set), otherwise falls back to `history.pushState`/`replaceState` directly.

### Signature

```ts
navigate(path: string, options?: { replace?: boolean }): Promise<void>
```

### Options / Returns

`options.replace` uses `replaceState` (no history entry stacked). Resolves when the target route is resolved.

### Usage

```ts
import { navigate } from "vanuikit";

await navigate("/dashboard");
await navigate("/settings", { replace: true });
```

### Notes

- Stacking vs. replacing: user-initiated navigation stacks; router redirects (guard verdicts) replace their history entry.

## `getActiveRouter`

Returns the currently active `Router` instance, or `null` if none is set.

### Signature

```ts
getActiveRouter(): Router | null
```

### Usage

```ts
import { getActiveRouter } from "vanuikit";

const router = getActiveRouter();
router?.navigate("/dashboard");
```

## `setActiveRouter`

Sets (or clears, with `null`) the active router used by global navigation.

### Signature

```ts
setActiveRouter(router: Router | null): void
```

### Usage

```ts
import { Router, setActiveRouter } from "vanuikit";

setActiveRouter(new Router({ /* options */ }));
```

## `createQuery`

Reactive data hook for GET-style requests. Runs on creation (by default) and keeps `data`, `loading`, `error`, and `status` synced with VanJS states. Automatically injects `Authorization: Bearer` from the persisted session token and uses `credentials: "include"`.

### Signature

```ts
createQuery<T>(url: string | (() => string), options?: QueryOptions<T>): QueryResult<T>
```

### Options / Returns

`QueryOptions<T>`:

| Option | Type | Default | Description |
|---|---|---|---|
| `transform` | `(raw: any) => T` | — | Transforms the response JSON before storing. |
| `immediate` | `boolean` | `true` | If `true`, runs the request immediately on creation. |
| `init` | `RequestInit \| (() => RequestInit)` | — | Extra fetch options (headers, method, etc.). |

`QueryResult<T>`:

| Member | Type | Description |
|---|---|---|
| `data` | `State<T \| null>` | Last successful response data. |
| `loading` | `State<boolean>` | Whether a request is in flight. |
| `error` | `State<string \| null>` | Last error message, if any. |
| `status` | `State<number \| null>` | Last HTTP status. |
| `refetch` | `() => Promise<T \| null>` | Re-runs the request. |
| `setData` | `(val: T \| null) => void` | Manually sets `data`. |

### Usage

```ts
import { createQuery } from "vanuikit";

const q = createQuery<***REMOVED***[]>("/api/***REMOVED***");
span(q.loading.val ? "Loading…" : q.data.val?.map(g => g.name).join(", "));
```

### Notes

- On non-OK responses, it throws and stores the message in `error` (preferring the JSON `error`/`message` body).
- Intended for use ONCE per component; reuse the returned states in bindings.

## `createMutation`

Reactive data hook for mutations (POST/PUT/DELETE/PATCH). Accepts a URL, a URL factory, or an async function that performs the request directly (returning the data); automatically sends JSON bodies and the auth header.

### Signature

```ts
createMutation<TData = any, TVariables = any>(
  urlOrFn:
    | string
    | ((variables: TVariables) => string)
    | ((variables: TVariables) => Promise<TData>),
  options?: MutationOptions<TData, TVariables>,
): MutationResult<TData, TVariables>
```

### Options / Returns

`MutationOptions<TData, TVariables>`:

| Option | Type | Description |
|---|---|---|
| `onSuccess` | `(data: TData, variables: TVariables) => void` | Called after a successful mutation. |
| `onError` | `(error: Error, variables: TVariables) => void` | Called after a failed mutation. |
| `init` | `RequestInit \| (() => RequestInit)` | Extra fetch options. |

`MutationResult<TData, TVariables>`:

| Member | Type | Description |
|---|---|---|
| `mutate` | `(variables: TVariables) => Promise<TData \| null>` | Runs the mutation. |
| `data` | `State<TData \| null>` | Last result. |
| `loading` | `State<boolean>` | Whether a mutation is in flight. |
| `error` | `State<string \| null>` | Last error message. |
| `reset` | `() => void` | Clears `data`, `loading`, and `error`. |

### Usage

```ts
import { createMutation } from "vanuikit";

const del = createMutation("/api/***REMOVED***");
await del.mutate({ id: "42" }); // POST /api/***REMOVED*** with JSON body
```

### Notes

- When a string URL is used, `mutate` performs a `POST` with `Content-Type: application/json` and `credentials: "include"`.
- If `urlOrFn` is an async function of arity 1, it is called directly and its return value is stored as `data`.

## `Await`

Declarative rendering from any `Promise` with `Pending`/`Error`/success slots.
Complements `createQuery` (fetch) for loose promises.

### Signature

```ts
Await<T>(props: AwaitProps<T>): HTMLElement
```

### Props

| Name | Type | Description |
|---|---|---|
| `promise` | `Promise<T> \| (() => Promise<T>)` | Promise (or factory) to render; resolved once on mount. |
| `loading?` | `() => ChildDom \| null` | Pending/first-render slot (default renders nothing). |
| `error?` | `(error: unknown) => ChildDom \| null` | Error slot; receives the rejection reason. |
| `success` | `(data: T) => ChildDom` | Required success slot; receives the resolved value. |

### Usage

```ts
import { Await, Skeleton, span } from "vanuikit";

Await({
  promise: fetchUser(id),
  loading: () => Skeleton(),
  error: (e) => span(`Failed: ${e}`),
  success: (user) => UserCard(user),
});
```

### Notes

- No user-facing text of its own — slots are fully consumer-owned (no i18n
  keys needed).
- Recreate the element to re-run the promise.

## `Required`

Validator factory: fails when the value is empty/whitespace-only.

### Signature

```ts
Required(msg?: string | State<string> = "Required field"): Validator
```

### Usage

```ts
import { Required } from "vanuikit";

const v = Required();
v.validate("");      // "Required field"
v.validate(" abc "); // null
```

### Notes

- `Validator` = `{ validate(value: string, data?: Record<string, unknown>): string | null }`.
- The message may be a reactive `State<string>`; it is resolved to its current value at validation time.

## `Email`

Validator factory: fails when the value is not a basic email address.

### Signature

```ts
Email(msg?: string | State<string> = "Invalid email address"): Validator
```

### Usage

```ts
import { Email } from "vanuikit";

const v = Email();
v.validate("a@b.com");  // null
v.validate("nope");     // "Invalid email address"
```

## `MinLength`

Validator factory: fails when the value length is below `min`.

### Signature

```ts
MinLength(min: number, msg?: string | State<string> = `Minimum ${min} characters`): Validator
```

### Usage

```ts
import { MinLength } from "vanuikit";

const v = MinLength(6);
v.validate("123");  // "Minimum 6 characters"
v.validate("123456"); // null
```

## `Match`

Validator factory: compares the value against another form field (e.g. password confirmation). Uses the `data` bag passed to `validate` (the full set of form values).

### Signature

```ts
Match(otherName: string, msg?: string | State<string> = "Values do not match"): Validator
```

### Usage

```ts
import { Match } from "vanuikit";

const v = Match("password");
v.validate("x", { password: "x" }); // null
v.validate("x", { password: "y" }); // "Values do not match"
```

## `cx`

Joins class names, discarding empty/falsy values.

### Signature

```ts
cx(...parts: Array<string | null | undefined | false>): string
```

### Usage

```ts
import { cx } from "vanuikit";

cx("a", null, "b", false); // "a b"
```

### Notes

- The result is trimmed. Useful for conditionally composing component class lists.

## `van`

The single VanJS instance shared by the whole library. Consumer apps **must** take `van` from `"vanuikit"` — never import `"vanjs-core"` directly.

### Signature

```ts
van: typeof import("vanjs-core").default
```

### Usage

```ts
import { van } from "vanuikit";

const count = van.state(0);
van.add(document.body, div(count));
```

### Notes

- **Why it matters:** two copies of `vanjs-core` in the same bundle are two state systems that do not talk to each other — reactivity silently breaks (views not updating on navigation, frozen bindings, empty/duplicated components).
- On module load, vanuikit runs `guardSingleVan(van)`: if a second copy registers itself (both copies pass through vanuikit), it logs a `console.error` with the exact fix instead of failing silently. The first copy stays registered.
- State provenance: the library captures the prototype of its own `van.state()` and exposes `isOwnState`/`isForeignState`. This is the only runtime detection that catches a consumer's *direct* `import van from "vanjs-core"` (which never passes through the guard registry).
- Consumers declare `vanjs-core` as a dependency (satisfying the peer dependency) but never import it directly.

## `isOwnState`

Returns `true` if the given value is a `State` created by this copy of vanjs-core (the copy vanuikit uses).

### Signature

```ts
isOwnState(x: unknown): boolean
```

### Usage

```ts
import { van, isOwnState } from "vanuikit";

const s = van.state(1);
isOwnState(s); // true
isOwnState({}); // false
```

### Notes

- Uses prototype identity against the captured `stateProto` of the library's copy.

## `isForeignState`

Returns `true` if the value has the shape of a vanjs-core state but is NOT backed by the library's own copy — i.e. it comes from another copy of the library.

### Signature

```ts
isForeignState(x: unknown): boolean
```

### Usage

```ts
import { isForeignState } from "vanuikit";

isForeignState(foreignStateFromAnotherCopy); // true
```

### Notes

- Uses the plain-data `_bindings` marker (an array present on every state), so it never triggers accessors and never flags plain objects or DOM nodes.

## `warnForeignState`

Emits a single, targeted console warning (per state) when a foreign state is found flowing into vanuikit. `hint` prefixes the message with where it was found.

### Signature

```ts
warnForeignState(x: unknown, hint?: string): void
```

### Usage

```ts
import { warnForeignState } from "vanuikit";

warnForeignState(someState, "as a prop of <Card>");
```

### Notes

- Warnings are deduplicated per state (WeakSet), so the same foreign state warns only once.

## `trace`

Development tool: logs every change of a `State` (initial value included) and returns it for chaining.

### Signature

```ts
trace<T>(state: State<T>, name?: string): State<T>
```

### Usage

```ts
import { trace, van } from "vanuikit";

const count = trace(van.state(0), "count");
```

### Notes

- Adds a permanent listener — do not call it inside bindings that re-execute. Best used in development only; remove it for production.

## `expectReactive`

Frozen-binding detector for test suites. Renders a tree, mutates states, waits for van's microtask, and throws an `Error` (with hints about common van gotchas) if the tree did not mutate to the expected text. Runner-agnostic (throws instead of using `expect`).

### Signature

```ts
expectReactive(opts: ExpectReactiveOptions): Promise<void>
```

### Options / Returns

`ExpectReactiveOptions`:

| Option | Type | Description |
|---|---|---|
| `render` | `() => ChildDom` | Builds the tree under test (mounted on a temporary host). |
| `act` | `() => void` | Mutates the states under test. |
| `text` | `string` | Exact text expected after `act()` (`textContent`). |
| `contains` | `string` | Substring expected after `act()`. |
| `tick` | `() => Promise<void>` | Custom wait (default: one microtask / van's binding cycle). |

### Usage

```ts
import { expectReactive } from "vanuikit";

await expectReactive({
  render: () => span(count),
  act: () => (count.val = 5),
  contains: "5",
});
```

### Notes

- Hints cover: null function-children, detached trees, and `t()`/`fmt`/`rawText` created inside bindings.

## `installVanDebug`

Dev-only instrumenter. Option-installs `van.state`/`van.derive` to build the real dependency tree and detect silent reactivity- violations at the moment they happen. No side effects on import; not in the production bundle.

### Signature

```ts
installVanDebug(van: VanLike): VanDebugApi
```

### Options / Returns

`VanDebugApi`:

| Member | Type | Description |
|---|---|---|
| `dump` | `() => VanDebugGraph` | Returns the current serializable graph. |
| `printTree` | `() => void` | Prints the dependency tree to the console. |
| `diagnostics` | `() => readonly VanDebugDiagnostic[]` | Accumulated diagnostics. |
| `clear` | `() => void` | Clears states, derives, and diagnostics (for tests). |
| `trackRender` | `<T>(fn: () => T, label?: string) => T` | Runs `fn` under a "render" frame; reports R4 if it reads reactive states. |
| `renderIntentional` | `<T>(fn: T) => T` | Marks a render function as intentionally reactive (suppresses R4 reporting). |
| `configure` | `(opts: { silent?: boolean }) => void` | `silent: true` stops printing warnings (still accumulates). |

Detected violations (`ViolationKind`): `state-in-derive` (R1), `derive-writes-state` (R2), `derive-cycle`, `derive-no-deps` (R3), `container-reactive-reads` (R4), and `foreign-state`.

### Usage

```ts
import { van, installVanDebug } from "vanuikit";

const debug = installVanDebug(van);
// ... start the app ...
debug.printTree();
console.log(debug.diagnostics());
```

### Notes

- Also patches `van.add` and `van.tags` to scan for foreign states at the DOM boundary, reporting a `foreign-state` diagnostic.
- In the demo, enable with `localStorage.van-debug = "1"` or `?van-debug`; the `/debug` view renders the graph as SVG.

## Server APIs (`vanuikit/server`)

The `./server` export re-exports everything from `session`, `hono`, `auth-routes`, and `route-loader`:

```ts
export * from "./session.js";
export * from "./hono.js";
export * from "./auth-routes.js";
export * from "./route-loader.js";
```

This includes session store types and implementations (`BaseUser`, `Session`, `SessionStore`, `MemorySessionStore`, `DatabaseSessionStore`, `KVSessionStore`, `generateSessionToken`), Hono middleware (`createAuthMiddleware`, `getSessionFromHonoContext`), `createAuthRoutes`, and `loadRoutes`.

## `loadRoutes`

Recursive scanner and auto-loader of Hono route files (`*.route.ts` / `*.route.js`) with a **deny-by-default** policy. Each file exports a Hono sub-app as `default` (or as the named `route`). Mounted paths mirror the folder hierarchy: `routes/api/auth.route.ts` → `/api/auth`.

### Signature

```ts
loadRoutes(routesDir: string, options?: LoadRoutesOptions): Promise<Hono>
```

### Options / Returns

`LoadRoutesOptions`:

| Option | Type | Description |
|---|---|---|
| `auth` | `MiddlewareHandler` | Authentication middleware (e.g. `createAuthMiddleware(...)`). If passed, every route is protected unless the file exports `meta = { public: true }`. |
| `onLoad` | `(info: LoadedRouteInfo) => void` | Optional callback per loaded route (`{ path, file, protected }`). The library does not log on its own. |

### Usage

```ts
// routes/api/public.route.ts
export const meta = { public: true }; // explicit opt-out → no guard
export default new Hono().get("/", (c) => c.json({ ok: true }));
```

```ts
// routes/api/private.route.ts — protected by default when auth is configured
import { Hono } from "hono";
export default new Hono().get("/data", (c) => c.json({ secret: true }));
```

```ts
import { Hono } from "hono";
import { loadRoutes, createAuthMiddleware, {SessionStore } from "vanuikit/server";

const app = new Hono();

const sessionStore = new MemorySessionStore<BaseUser>();
const requireAuth = createAuthMiddleware({ sessionStore });

app.route("/api", await loadRoutes("./routes", { auth: requireAuth }));
```

### Notes

- **Deny-by-default:** with `options.auth` configured, EVERY route is protected unless the file exports `export const meta = { public: true }` — the developer declares what is public and never forgets what is protected. The only possible error is the harmless opposite (a public route asks for login, and it shows instantly).
- Progress is deterministic (`readdirSync` results are sorted by name).
- Requires a runtime capable of importing the route files (tsx/bun, or routes already compiled to `.js`).

## `createAuthRoutes`

Builds a ready-made Hono app with `/register`, `/login`, `/me`, and `/logout` endpoints backed by a session store.

### Signature

```ts
createAuthRoutes<TUser extends BaseUser = BaseUser>(
  options: CreateAuthRoutesOptions<TUser>,
): Hono
```

### Options / Returns

`CreateAuthRoutesOptions<TUser>`:

| Option | Type | Description |
|---|---|---|
| `sessionStore` | `SessionStore<TUser>` | Store used to create/lookup/delete sessions. |
| `cookieName` | `string` | Session cookie name (default `"session_token"`). |
| `cookieOptions` | `CookieConfig` | Cookie `path`, `httpOnly`, `secure`, `sameSite`. |
| `onLogin` | `(credentials, c) => Promise<TUser \| null> \| TUser \| null` | Validates credentials; returns the user or `null`. |
| `onRegister` | `(data, c) => Promise<TUser \| { error: string; status?: number }>` | Optional; enables `/register`. |
| `onLogout` | `(token, c) => Promise<void> \| void` | Optional hook after session deletion. |
| `serializeUser` | `(user: TUser) => any` | Maps the stored user for JSON responses (default: identity). |

Endpoints:

- `POST /register` — 201 with `{ user, token, expiresAt }`, or 400 with `{ error }`.
- `POST /login` — 200 with `{ user, token, expiresAt }`, or 401 on bad credentials.
- `GET /me` — protected by `createAuthMiddleware`; returns `{ user }`.
- `POST /logout` — deletes the session (Bearer header or cookie) and clears the cookie.

### Usage

```ts
import { createAuthRoutes, MemorySessionStore } from "vanuikit/server";
import { Hono } from "hono";

const app = new Hono();
const sessionStore = new MemorySessionStore();

app.route(
  "/auth",
  createAuthRoutes({
    sessionStore,
    onLogin: async ({ email, password }) => {
      const user = await verifyCredentials(email, password);
      return user;
    },
  }),
);
```

### Notes

- Cookie defaults: `path: "/"`, `httpOnly: true`, `secure: NODE_ENV === "production"`, `sameSite: "Lax"`.
- The auth middleware reads the token from the `Authorization: Bearer` header first, then from the session cookie.

## `createAuthMiddleware`

Hono middleware that protects a route. It looks up the session by token (Bearer header, then cookie) and rejects with 401 `{ error, code: "UNAUTHORIZED" }` if none is valid. On success it sets `user` and `session` on the Hono context.

### Signature

```ts
createAuthMiddleware<TUser extends BaseUser = BaseUser>(
  options: AuthMiddlewareOptions<TUser>,
): MiddlewareHandler<{ Variables: HonoAuthVariables<TUser> }>
```

### Options / Returns

`AuthMiddlewareOptions<TUser>`:

| Option | Type | Default | Description |
|---|---|---|---|
| `sessionStore` | `SessionStore<TUser>` | — | Store used to validate the token. |
| `cookieName` | `string` | `"session_token"` | Cookie name to read. |
| `unauthorizedMessage` | `string` | `"Unauthorized. Sign in to access this resource."` | Error message on rejection. |

Context variables (`HonoAuthVariables<TUser>`): `user: TUser` and `session: Session<TUser>`.

### Usage

```ts
import { Hono } from "hono";
import { createAuthMiddleware, MemorySessionStore } from "vanuikit/server";

const auth = createAuthMiddleware({ sessionStore: new MemorySessionStore() });
const app = new Hono();
app.use("/private/*", auth);
app.get("/private/me", (c) => c.json({ user: c.get("user") }));
```

## `getSessionFromHonoContext`

Resolves the current session from a Hono context (Bearer header first, then cookie) and returns it or `null`.

### Signature

```ts
getSessionFromHonoContext<TUser extends BaseUser = BaseUser>(
  c: any,
  sessionStore: SessionStore<TUser>,
  cookieName?: string = "session_token",
): Promise<Session<TUser> | null>
```

### Usage

```ts
import { getSessionFromHonoContext } from "vanuikit/server";

const session = await getSessionFromHonoContext(c, sessionStore);
```

## `BaseUser`

The base user shape used by the server session system.

### Signature

```ts
type BaseUser = {
  id: string | number;
  email?: string;
  name?: string;
  [key: string]: any;
};
```

## `Session`

The session record produced by a `SessionStore`.

### Signature

```ts
type Session<TUser extends BaseUser = BaseUser> = {
  token: string;
  userId: string | number;
  user: TUser;
  createdAt: Date;
  expiresAt: Date;
};
```

## `SessionStore`

Interface for session backends.

### Signature

```ts
interface SessionStore<TUser extends BaseUser = BaseUser> {
  create(user: TUser, ttlSeconds?: number): MaybePromise<Session<TUser>>;
  get(token: string): MaybePromise<Session<TUser> | null>;
  delete(token: string): MaybePromise<boolean>;
  deleteByUser(userId: string | number): MaybePromise<number>;
  cleanExpired?(): MaybePromise<number>;
}
```

### Notes

- `MaybePromise<T>` = `T | Promise<T>`.
- `cleanExpired` is optional; calling `get` on an expired session clears it.

## `MemorySessionStore`

In-memory `SessionStore` implementation (default TTL 86400 seconds = 1 day).

### Signature

```ts
new MemorySessionStore<TUser extends BaseUser = BaseUser>(options?: SessionStoreOptions)
```

### Options / Returns

`SessionStoreOptions`: `{ defaultTtlSeconds?: number }` (default `86400`).

### Usage

```ts
import { MemorySessionStore } from "vanuikit/server";

const store = new MemorySessionStore({ defaultTtlSeconds: 3600 });
```

### Notes

- Suitable for development/tests; not persistent across processes.

## `DatabaseSessionStore`

`SessionStore` implementation backed by user-provided database handlers.

### Signature

```ts
new DatabaseSessionStore<TUser extends BaseUser = BaseUser>(
  handlers: DatabaseAdapterHandlers<TUser>,
  options?: SessionStoreOptions,
)
```

### Options / Returns

`DatabaseAdapterHandlers<TUser>`:

| Handler | Type | Description |
|---|---|---|
| `saveSession` | `(session: Session<TUser>) => Promise<void>` | Persist a session. |
| `findSession` | `(token: string) => Promise<Session<TUser> \| null>` | Look up a session. |
| `deleteSession` | `(token: string) => Promise<boolean \| void>` | Delete a session. |
| `deleteUserSessions` | `(userId: string \| number) => Promise<number \| void>` | Delete all sessions for a user. |
| `cleanExpiredSessions` | `(now: Date) => Promise<number \| void>` | Optional bulk cleanup. |

### Usage

```ts
import { DatabaseSessionStore } from "vanuikit/server";

const store = new DatabaseSessionStore({
  saveSession: (s) => db.save(s),
  findSession: (t) => db.find(t),
  deleteSession: (t) => db.del(t),
  deleteUserSessions: (id) => db.delForUser(id),
});
```

## `KVSessionStore`

`SessionStore` implementation backed by a key-value store (e.g. Redis, Cloudflare KV).

### Signature

```ts
new KVSessionStore<TUser extends BaseUser = BaseUser>(
  kvClient: KVClient,
  options?: KVSessionStoreOptions,
)
```

### Options / Returns

`KVClient`: `{ get(key): Promise<string | null>; set(key, value, options?): Promise<any>; del(key): Promise<any> }`.

`KVSessionStoreOptions` extends `SessionStoreOptions` and adds `keyPrefix?: string` (default `"vanuikit:session:"`).

### Usage

```ts
import { KVSessionStore } from "vanuikit/server";

const store = new KVSessionStore(redisClient, { keyPrefix: "sess:" });
```

### Notes

- Session values are stored as JSON, with TTL passed to the KV store.
- `deleteByUser` always returns `1` (the KV backend cannot enumerate keys by user).

## `generateSessionToken`

Generates a cryptographically strong session token (UUID-based when available) and returns it.

### Signature

```ts
generateSessionToken(): string
```

### Usage

```ts
import { generateSessionToken } from "vanuikit/server";

const token = generateSessionToken();
```
